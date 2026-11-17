export const dynamic = 'force-dynamic';
// SARVONAYA Universal Media & File Upload API
// Uploads to Supabase Storage (bucket: 'sarvonaya-media') with local filesystem/data URL fallback
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    const bucket = (formData.get('bucket') as string) || (folder === 'banners' ? 'banners' : 'sarvonaya-media');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    // File size limit: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedName}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    // 1. Try uploading to Supabase Storage
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!error && data) {
          const { data: pub } = supabase.storage
            .from(bucket)
            .getPublicUrl(storagePath);

          return NextResponse.json({
            success: true,
            url: pub.publicUrl,
            filename: file.name,
            size: file.size,
            type: file.type,
          });
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload failed, using fallback:', storageErr);
      }
    }

    // 2. Fallback to local public uploads directory
    try {
      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }
      const localFilePath = path.join(publicUploadsDir, uniqueFileName);
      fs.writeFileSync(localFilePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${uniqueFileName}`,
        filename: file.name,
        size: file.size,
        type: file.type,
      });
    } catch {
      // 3. Fallback for serverless environments: Base64 Data URL (for images under 4MB)
      if (file.size <= 4 * 1024 * 1024) {
        const base64Data = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Data}`;
        return NextResponse.json({
          success: true,
          url: dataUrl,
          filename: file.name,
          size: file.size,
          type: file.type,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Could not store file on server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ success: false, error: 'File upload failed' }, { status: 500 });
  }
}
