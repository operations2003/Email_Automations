import { getDb } from './mongodb';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/company';

/**
 * Company database operations service
 * Provides CRUD operations for the companies collection
 */

export async function getCompanies(): Promise<Company[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const companies = await db.collection('companies')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    return companies.map(doc => ({
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
  } catch (error) {
    console.error('[Companies Service] Error fetching companies:', error);
    throw error;
  }
}

export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const doc = await db.collection('companies').findOne({
      $or: [
        { id: id },
        { _id: id }
      ]
    });

    if (!doc) {
      return null;
    }

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
  } catch (error) {
    console.error('[Companies Service] Error fetching company by id:', error);
    throw error;
  }
}

export async function createCompany(data: CreateCompanyRequest, createdBy: string): Promise<Company> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

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

    await db.collection('companies').insertOne({
      ...newCompany,
      _id: undefined // Let MongoDB generate _id
    });

    return newCompany;
  } catch (error) {
    console.error('[Companies Service] Error creating company:', error);
    throw error;
  }
}

export async function updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Check if company exists
    const existingCompany = await db.collection('companies').findOne({
      $or: [
        { id: id },
        { _id: id }
      ]
    });

    if (!existingCompany) {
      throw new Error('Company not found');
    }

    // Check for conflicts with other companies (if name/email is being changed)
    if (data.name || data.email) {
      const conflictQuery: any = {
        $and: [
          {
            $or: [
              { id: { $ne: id } },
              { _id: { $ne: id } }
            ]
          },
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
      {
        $or: [
          { id: id },
          { _id: id }
        ]
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Company not found');
    }

    // Get the updated company
    const updatedCompany = await db.collection('companies').findOne({
      $or: [
        { id: id },
        { _id: id }
      ]
    });

    if (!updatedCompany) {
      throw new Error('Failed to retrieve updated company');
    }

    return {
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
  } catch (error) {
    console.error('[Companies Service] Error updating company:', error);
    throw error;
  }
}

export async function deleteCompany(id: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Soft delete by setting isActive to false
    const result = await db.collection('companies').updateOne(
      {
        $or: [
          { id: id },
          { _id: id }
        ]
      },
      {
        $set: {
          isActive: false,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Company not found');
    }
  } catch (error) {
    console.error('[Companies Service] Error deleting company:', error);
    throw error;
  }
}

export async function getActiveCompaniesForEmployee(): Promise<Pick<Company, 'id' | 'name' | 'email'>[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

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
  } catch (error) {
    console.error('[Companies Service] Error fetching companies for employee:', error);
    throw error;
  }
}