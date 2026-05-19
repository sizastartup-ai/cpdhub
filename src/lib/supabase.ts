/**
 * Reusable Supabase Storage Utility
 * Uses the native REST API to avoid extra dependency footprint and package conflicts.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'resources';

export async function uploadToSupabase(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase configuration. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.'
    );
  }

  // Sanitize file name to avoid path traversal or special character issues in storage
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${Date.now()}_${sanitizedFileName}`;

  // Supabase Storage REST API upload endpoint
  // Format: https://<project-id>.supabase.co/storage/v1/object/<bucket>/<file-path>
  const cleanUrl = SUPABASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
  const uploadUrl = `${cleanUrl}/storage/v1/object/${SUPABASE_BUCKET_NAME}/${filePath}`;

  console.log(`Uploading file to Supabase: ${uploadUrl} (${contentType})`);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': contentType,
      // Duplicating or upserting if needed. True to overwrite, false to fail if exists.
      'x-upsert': 'true',
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Supabase upload REST failure:', errorText);
    throw new Error(`Supabase Storage upload failed: ${response.statusText} (${errorText})`);
  }

  // Construct and return the permanent public URL
  // Format: https://<project-id>.supabase.co/storage/v1/object/public/<bucket>/<file-path>
  const publicUrl = `${cleanUrl}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${filePath}`;
  return publicUrl;
}
