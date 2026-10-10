import fs from 'fs/promises';
import path from 'path';
import { ObjectId, Filter, Document } from 'mongodb';
import { getDb } from './mongodb';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/company';

function getCompanyIdFilter(id: string): Filter<Document> {
  if (ObjectId.isValid(id) && id.length === 24) {
    return { $or: [{ id: id }, { _id: new ObjectId(id) }] };
  }
  return { id: id };
}

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (process.platform === 'linux' && process.cwd().startsWith('/var/task'))
);

const DATA_DIR = isServerless ? path.join('/tmp', 'tasknera_data') : path.join(process.cwd(), 'data');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');

let inMemoryCompanies: Company[] = [];

async function readCompaniesFromFile(): Promise<Company[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
    const data = await fs.readFile(COMPANIES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      inMemoryCompanies = parsed;
      return parsed;
    }
  } catch {
    // fallback to in-memory
  }
  return inMemoryCompanies;
}

async function writeCompaniesToFile(companies: Company[]): Promise<void> {
  inMemoryCompanies = companies;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
    await fs.writeFile(COMPANIES_FILE, JSON.stringify(companies, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Companies Service] Failed to write companies to file:', err);
  }
}

/**
 * Company database operations service
 * Provides CRUD operations for the companies collection with file fallback
 */

export async function getCompanies(): Promise<Company[]> {
  try {
    const db = await getDb();
    if (db) {
      const companies = await db.collection('companies')
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .toArray();

      const mapped = companies.map(doc => ({
        id: doc.id || doc._id.toString(),
        name: doc.name,
        email: doc.email,
        description: doc.description || '',
        website: doc.website || '',
        industry: doc.industry || '',
        isActive: doc.isActive ?? true,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString(),
        createdBy: doc.createdBy || 'system'
      }));
      inMemoryCompanies = mapped;
      return mapped;
    }
  } catch (error) {
    console.warn('[Companies Service] MongoDB query failed, falling back to local file:', error);
  }

  // Fallback to local file storage
  const fileCompanies = await readCompaniesFromFile();
  return fileCompanies
    .filter(c => c.isActive !== false)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    const db = await getDb();
    if (db) {
      const doc = await db.collection('companies').findOne(getCompanyIdFilter(id));

      if (doc) {
        return {
          id: doc.id || doc._id.toString(),
          name: doc.name,
          email: doc.email,
          description: doc.description || '',
          website: doc.website || '',
          industry: doc.industry || '',
          isActive: doc.isActive ?? true,
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString(),
          createdBy: doc.createdBy || 'system'
        };
      }
      return null;
    }
  } catch (error) {
    console.warn('[Companies Service] MongoDB fetch by id failed, using fallback:', error);
  }

  const companies = await readCompaniesFromFile();
  return companies.find(c => c.id === id) || null;
}

export async function createCompany(data: CreateCompanyRequest, createdBy: string): Promise<Company> {
  const now = new Date().toISOString();
  const companyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newCompany: Company = {
    id: companyId,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    description: data.description?.trim() || '',
    website: data.website?.trim() || '',
    industry: data.industry?.trim() || '',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy
  };

  try {
    const db = await getDb();
    if (db) {
      // Check for existing company with same name or email
      const existingCompany = await db.collection('companies').findOne({
        $or: [
          { name: { $regex: new RegExp(`^${data.name}$`, 'i') } },
          { email: { $regex: new RegExp(`^${data.email}$`, 'i') } }
        ],
        isActive: true
      });

      if (existingCompany) {
        throw new Error('Company with this name or email already exists');
      }

      await db.collection('companies').insertOne({
        ...newCompany,
        _id: undefined
      });

      // Also sync to file
      const companies = await readCompaniesFromFile();
      companies.unshift(newCompany);
      await writeCompaniesToFile(companies);

      return newCompany;
    }
  } catch (error: any) {
    if (error?.message === 'Company with this name or email already exists') {
      throw error;
    }
    console.warn('[Companies Service] MongoDB createCompany failed, using fallback:', error);
  }

  // Fallback to local file storage
  const companies = await readCompaniesFromFile();
  const existing = companies.find(
    c => c.isActive && (c.name.toLowerCase() === newCompany.name.toLowerCase() || c.email.toLowerCase() === newCompany.email.toLowerCase())
  );
  if (existing) {
    throw new Error('Company with this name or email already exists');
  }

  companies.unshift(newCompany);
  await writeCompaniesToFile(companies);
  return newCompany;
}

export async function updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
  try {
    const db = await getDb();
    if (db) {
      // Check if company exists
      const existingCompany = await db.collection('companies').findOne(getCompanyIdFilter(id));

      if (!existingCompany) {
        throw new Error('Company not found');
      }

      // Check for conflicts with other companies (if name/email is being changed)
      if (data.name || data.email) {
        const conflictQuery: any = {
          $and: [
            { id: { $ne: id } },
            { isActive: true }
          ]
        };

        const orConditions = [];
        if (data.name && data.name !== existingCompany.name) {
          orConditions.push({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
        }
        if (data.email && data.email !== existingCompany.email) {
          orConditions.push({ email: { $regex: new RegExp(`^${data.email}$`, 'i') } });
        }

        if (orConditions.length > 0) {
          conflictQuery.$and.push({ $or: orConditions });

          const conflictingCompany = await db.collection('companies').findOne(conflictQuery);
          if (conflictingCompany) {
            throw new Error('Another company with this name or email already exists');
          }
        }
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.website !== undefined) updateData.website = data.website.trim();
      if (data.industry !== undefined) updateData.industry = data.industry.trim();
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      // Update the company
      const result = await db.collection('companies').updateOne(
        getCompanyIdFilter(id),
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Company not found');
      }

      // Get the updated company
      const updatedCompany = await db.collection('companies').findOne(getCompanyIdFilter(id));

      if (!updatedCompany) {
        throw new Error('Failed to retrieve updated company');
      }

      const mapped: Company = {
        id: updatedCompany.id || updatedCompany._id.toString(),
        name: updatedCompany.name,
        email: updatedCompany.email,
        description: updatedCompany.description || '',
        website: updatedCompany.website || '',
        industry: updatedCompany.industry || '',
        isActive: updatedCompany.isActive ?? true,
        createdAt: updatedCompany.createdAt || new Date().toISOString(),
        updatedAt: updatedCompany.updatedAt || new Date().toISOString(),
        createdBy: updatedCompany.createdBy || 'system'
      };

      // Sync file
      const companies = await readCompaniesFromFile();
      const idx = companies.findIndex(c => c.id === id);
      if (idx !== -1) {
        companies[idx] = mapped;
        await writeCompaniesToFile(companies);
      }

      return mapped;
    }
  } catch (error: any) {
    if (error?.message === 'Company not found' || error?.message?.includes('already exists')) {
      throw error;
    }
    console.warn('[Companies Service] MongoDB updateCompany failed, using fallback:', error);
  }

  // Fallback to local file storage
  const companies = await readCompaniesFromFile();
  const idx = companies.findIndex(c => c.id === id);
  if (idx === -1) {
    throw new Error('Company not found');
  }

  const existingCompany = companies[idx];
  if (data.name && data.name.trim().toLowerCase() !== existingCompany.name.toLowerCase()) {
    const conflict = companies.find(
      c => c.id !== id && c.isActive && c.name.toLowerCase() === data.name!.trim().toLowerCase()
    );
    if (conflict) throw new Error('Another company with this name or email already exists');
  }
  if (data.email && data.email.trim().toLowerCase() !== existingCompany.email.toLowerCase()) {
    const conflict = companies.find(
      c => c.id !== id && c.isActive && c.email.toLowerCase() === data.email!.trim().toLowerCase()
    );
    if (conflict) throw new Error('Another company with this name or email already exists');
  }

  const updated: Company = {
    ...existingCompany,
    name: data.name !== undefined ? data.name.trim() : existingCompany.name,
    email: data.email !== undefined ? data.email.trim().toLowerCase() : existingCompany.email,
    description: data.description !== undefined ? data.description.trim() : existingCompany.description,
    website: data.website !== undefined ? data.website.trim() : existingCompany.website,
    industry: data.industry !== undefined ? data.industry.trim() : existingCompany.industry,
    isActive: data.isActive !== undefined ? data.isActive : existingCompany.isActive,
    updatedAt: new Date().toISOString()
  };

  companies[idx] = updated;
  await writeCompaniesToFile(companies);
  return updated;
}

export async function deleteCompany(id: string): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      await db.collection('companies').updateOne(
        getCompanyIdFilter(id),
        {
          $set: {
            isActive: false,
            updatedAt: new Date().toISOString()
          }
        }
      );
      const companies = await readCompaniesFromFile();
      const idx = companies.findIndex(c => c.id === id);
      if (idx !== -1) {
        companies[idx].isActive = false;
        companies[idx].updatedAt = new Date().toISOString();
        await writeCompaniesToFile(companies);
      }
      return;
    }
  } catch (error) {
    console.warn('[Companies Service] MongoDB deleteCompany failed, using fallback:', error);
  }

  // Fallback to local file storage
  const companies = await readCompaniesFromFile();
  const idx = companies.findIndex(c => c.id === id);
  if (idx === -1) {
    throw new Error('Company not found');
  }
  companies[idx].isActive = false;
  companies[idx].updatedAt = new Date().toISOString();
  await writeCompaniesToFile(companies);
}

export async function deleteCompanies(ids: string[]): Promise<number> {
  if (!ids || ids.length === 0) return 0;
  const now = new Date().toISOString();
  const idSet = new Set(ids);

  try {
    const db = await getDb();
    if (db) {
      const objectIds: ObjectId[] = [];
      const stringIds: string[] = [];

      for (const id of ids) {
        stringIds.push(id);
        if (ObjectId.isValid(id) && id.length === 24) {
          try {
            objectIds.push(new ObjectId(id));
          } catch {}
        }
      }

      const orConditions: any[] = [{ id: { $in: stringIds } }];
      if (objectIds.length > 0) {
        orConditions.push({ _id: { $in: objectIds } });
      }

      const result = await db.collection('companies').updateMany(
        { $or: orConditions },
        {
          $set: {
            isActive: false,
            updatedAt: now
          }
        }
      );

      const companies = await readCompaniesFromFile();
      for (const comp of companies) {
        if (idSet.has(comp.id)) {
          comp.isActive = false;
          comp.updatedAt = now;
        }
      }
      await writeCompaniesToFile(companies);

      return result.modifiedCount || ids.length;
    }
  } catch (error) {
    console.warn('[Companies Service] MongoDB deleteCompanies failed, using fallback:', error);
  }

  // Fallback to local file storage
  const companies = await readCompaniesFromFile();
  let count = 0;
  for (const comp of companies) {
    if (idSet.has(comp.id) && comp.isActive !== false) {
      comp.isActive = false;
      comp.updatedAt = now;
      count++;
    }
  }
  await writeCompaniesToFile(companies);
  return count;
}

export async function getActiveCompaniesForEmployee(): Promise<Pick<Company, 'id' | 'name' | 'email'>[]> {
  try {
    const db = await getDb();
    if (db) {
      const companies = await db.collection('companies')
        .find(
          { isActive: true },
          { projection: { id: 1, _id: 1, name: 1, email: 1 } }
        )
        .sort({ name: 1 })
        .toArray();

      return companies.map(doc => ({
        id: doc.id || doc._id.toString(),
        name: doc.name,
        email: doc.email
      }));
    }
  } catch (error) {
    console.warn('[Companies Service] MongoDB getActiveCompaniesForEmployee failed, using fallback:', error);
  }

  const companies = await readCompaniesFromFile();
  return companies
    .filter(c => c.isActive !== false)
    .map(c => ({
      id: c.id,
      name: c.name,
      email: c.email
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}