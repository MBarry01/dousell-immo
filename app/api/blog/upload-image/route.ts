import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { uploadToCloudinary } from '@/lib/cloudinary-utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Auth check
  try {
    const adminOk = await isAdmin();
    if (!adminOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (authError) {
    console.error('[blog/upload-image] Auth error:', authError);
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }

  // Upload
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await uploadToCloudinary(base64, 'blog', ['blog-article']);

    if ('error' in result) {
      console.error('[blog/upload-image] Cloudinary error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ publicId: result.publicId, url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[blog/upload-image] Unexpected error:', message, error);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
