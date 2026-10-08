import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await validateCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = createAuthToken(user);
    const res = NextResponse.json({
      success: true,
      user,
      token,
      message: `Logged in successfully as ${user.role}`
    });

    // Set HTTP-only cookie for persistence
    res.cookies.set('auth_token', token, {
      httpOnly: false, // Accessible to client-side JS for simple auth state hydration
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return res;
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
