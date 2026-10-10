import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getCompanies, createCompany, deleteCompanies } from '@/lib/companies';
import { CreateCompanyRequest } from '@/types/company';

// GET /api/companies - List all companies
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const companies = await getCompanies();

    return NextResponse.json({
      success: true,
      companies
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Companies API] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateCompanyRequest = await req.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Company name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const newCompany = await createCompany(body, user.id);

    return NextResponse.json({
      success: true,
      message: 'Company created successfully',
      company: newCompany
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Companies API] POST error:', err);
    
    if (err.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/companies - Bulk delete companies
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const ids: string[] = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array of company IDs is required' },
        { status: 400 }
      );
    }

    const deletedCount = await deleteCompanies(ids);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} ${deletedCount === 1 ? 'company' : 'companies'}`
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Companies API] Bulk DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}