import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profession: true },
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profession: user.profession?.name,
        role: user.role,
      },
    });

    response.cookies.set('cpdhub_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
