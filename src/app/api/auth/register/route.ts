import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { fullName, email, password, profession, country } = await req.json();

    if (!fullName || !email || !password || !profession) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const professionRecord = await prisma.profession.findUnique({
      where: { name: profession },
    });

    if (!professionRecord) {
      return NextResponse.json({ error: 'Invalid profession' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashedPassword,
        professionId: professionRecord.id,
        country: country || 'Kenya',
        role: 'Learner',
      },
    });

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      message: 'Success',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profession: profession,
        role: user.role,
      },
    });

    // Set cookie for simple JWT session management
    response.cookies.set('cpdhub_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
