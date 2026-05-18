import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { uploadToSupabase } from '@/lib/supabase';

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

    // Upload directly to Supabase Storage and get its public URL
    const publicUrl = await uploadToSupabase(buffer, file.name, file.type);

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
    return NextResponse.json({ error: err.message || 'Upload failed. Please try again.' }, { status: 500 });
  }
}
