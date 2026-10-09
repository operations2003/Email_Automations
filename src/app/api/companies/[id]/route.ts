import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { updateCompany, deleteCompany } from '@/lib/companies';
import { UpdateCompanyRequest } from '@/types/company';

// PUT /api/companies/[id] - Update a company
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: UpdateCompanyRequest = await req.json();

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const updatedCompany = await updateCompany(id, body);

    return NextResponse.json({
      success: true,
      message: 'Company updated successfully',
      company: updatedCompany
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Companies API] PUT error:', err);
    
    if (err.message === 'Company not found') {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }
    
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

// DELETE /api/companies/[id] - Soft delete a company
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await deleteCompany(id);

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Companies API] DELETE error:', err);
    
    if (err.message === 'Company not found') {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}