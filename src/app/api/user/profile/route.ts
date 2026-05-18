import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fullName, email, phone, image } = await req.json();

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.id !== session.userId) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName,
        email,
        phone: phone || '',
        image: image || '',
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      image: updatedUser.image,
    });

  } catch (error) {
    console.error('Profile Update API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
