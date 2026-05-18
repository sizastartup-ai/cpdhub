import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const moduleId = formData.get('moduleId') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;

    if (!file || !moduleId || !title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resources');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Professional safe filename
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${Date.now()}_${sanitizedTitle}_${file.name.replace(/\s/g, '_')}`;
    const filePath = join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/resources/${fileName}`;

    const resource = await (prisma as any).resource.create({
      data: {
        moduleId,
        title,
        type,
        url: publicUrl
      }
    });

    return NextResponse.json(resource);
  } catch (err: any) {
    console.error('Resource upload failure:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
