import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getActiveCompaniesForEmployee } from '@/lib/companies';

// GET /api/companies/for-employees - Get companies for employee selection
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const companies = await getActiveCompaniesForEmployee();

    return NextResponse.json({
      success: true,
      companies
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Companies API] GET for-employees error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}