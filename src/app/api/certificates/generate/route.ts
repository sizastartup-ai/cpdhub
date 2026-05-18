import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    const { courseId } = await req.json();
    const session = await getSessionUser();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if user is enrolled and finished (MVP: we'll check if enrollment exists)
    const enrollment = await prisma.enrollment.findFirst({
      where: { 
        userId: session.userId, 
        courseId, 
        status: 'Completed' 
      },
    });

    if (!enrollment) return NextResponse.json({ error: 'Course status must be "Completed" to receive a certificate.' }, { status: 400 });

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: { userId: session.userId, courseId },
    });

    if (existingCert) return NextResponse.json(existingCert);

    const certificateUuid = uuidv4();
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${certificateUuid}`;
    
    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(verificationUrl);

    const certificate = await prisma.certificate.create({
      data: {
        userId: session.userId,
        courseId,
        certificateUuid,
        qrCodeUrl,
      },
    });

    return NextResponse.json(certificate);
  } catch (err: any) {
    console.error('Certificate generation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
