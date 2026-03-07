import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  revalidatePath('/pro/blog/[slug]', 'page');
  return NextResponse.json({ message: 'Cache revalidated' });
}
