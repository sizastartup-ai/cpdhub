import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import xml2js from 'xml2js';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const lessonId = formData.get('lessonId') as string;
    const courseId = formData.get('courseId') as string;
    const file = formData.get('file') as File;

    if ((!lessonId && !courseId) || !file) {
      return NextResponse.json({ error: 'Missing source ID or file' }, { status: 400 });
    }

    let targetLessonId = lessonId;

    // Handle course-level upload by creating a lesson automatically
    if (!targetLessonId && courseId) {
      // Find or create module
      let moduleRecord = await prisma.module.findFirst({ where: { courseId } });
      if (!moduleRecord) {
        moduleRecord = await prisma.module.create({
          data: { courseId, title: 'Main Module', order: 1 }
        });
      }

      const lessonCount = await prisma.lesson.count({ where: { moduleId: moduleRecord.id } });
      const newLesson = await prisma.lesson.create({
        data: {
          moduleId: moduleRecord.id,
          title: `SCORM Content - ${file.name.replace('.zip', '')}`,
          order: lessonCount + 1,
          contentType: 'SCORM',
          contentUrl: '',
        }
      });
      targetLessonId = newLesson.id;
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: targetLessonId } });
    if (!lesson) {
      return NextResponse.json({ error: 'Target lesson not found' }, { status: 404 });
    }

    // Read the file buffer
    const buffer = Buffer.from(await file.arrayBuffer());


    // Define extraction path inside public folder
    const extractPath = path.join(process.cwd(), 'public', 'scorm', targetLessonId);
    
    // Clean up existing if present
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    fs.mkdirSync(extractPath, { recursive: true });

    // Extract zip
    const zipDirectory = await unzipper.Open.buffer(buffer);
    await zipDirectory.extract({ path: extractPath });

    // Find imsmanifest.xml
    const manifestPath = path.join(extractPath, 'imsmanifest.xml');
    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({ error: 'imsmanifest.xml not found in the SCORM package' }, { status: 400 });
    }

    // Parse XML to find the entry point
    const xmlContent = fs.readFileSync(manifestPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);

    let entryPoint = '';

    // The logic to find the starting href. Usually: manifest -> resources -> resource -> href
    const resources = result.manifest.resources?.[0]?.resource;
    if (resources && resources.length > 0) {
      // Find the first resource that has adlcp:scormType="sco" or type="webcontent"
      // Often the first one is the main starting point if there's no complex organization.
      for (const res of resources) {
        if (res.$ && res.$.href) {
          entryPoint = res.$.href;
          break; // Grab the first href (simplification for basic SCORM)
        }
      }
    }

    if (!entryPoint) {
      // Fallback
      entryPoint = 'index_lms.html';
    }

    // Update Database
    await prisma.lesson.update({
      where: { id: targetLessonId },
      data: {
        isScorm: true,
        scormEntry: entryPoint,
        contentType: 'SCORM',
        contentUrl: `/scorm/${targetLessonId}/${entryPoint}`,
      },
    });

    return NextResponse.json({ 
      message: 'SCORM package uploaded and extracted successfully',
      entryPoint,
    });
  } catch (error: any) {
    console.error('SCORM Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
