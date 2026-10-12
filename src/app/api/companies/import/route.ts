import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { importCompanies } from '@/lib/companies';
import { CreateCompanyRequest } from '@/types/company';

// POST /api/companies/import - Bulk import companies from Excel/CSV
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const companies: CreateCompanyRequest[] = body?.companies;

    if (!Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No companies provided for import' },
        { status: 400 }
      );
    }

    const result = await importCompanies(companies, user.id);

    return NextResponse.json({
      success: true,
      message: `Import completed: ${result.importedCount} new companies added (${result.skippedCount} skipped or already existing).`,
      ...result
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Companies API] Import POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to import companies' },
      { status: 500 }
    );
  }
}
