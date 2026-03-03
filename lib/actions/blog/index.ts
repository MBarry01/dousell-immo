// lib/actions/blog/index.ts
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAnyRole } from '@/lib/permissions';
import { titleToSlug } from '@/lib/blog/slug';
import { calculateReadTime } from '@/lib/blog/read-time';
import { markdownToBlocks } from '@/lib/blog/markdown-to-blocks';
import type { CreateArticleInput, UpdateArticleInput, ArticleBlock } from '@/types/article';

async function adminGuard() {
  await requireAnyRole(['admin', 'superadmin']);
}

export async function createArticle(input: CreateArticleInput) {
  await adminGuard();

  const slug = input.slug || titleToSlug(input.title);

  const { data, error } = await supabaseAdmin
    .from('articles')
    .insert({ ...input, slug })
    .select()
    .single();

  if (error) throw new Error(`createArticle: ${error.message}`);
  return data;
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  await adminGuard();

  const { data, error } = await supabaseAdmin
    .from('articles')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`updateArticle: ${error.message}`);

  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  revalidatePath(`/pro/blog/${data.slug}`);
  revalidatePath(`/blog/${data.slug}`);

  return data;
}

export async function publishArticle(id: string) {
  await adminGuard();

  const { data: article, error: fetchError } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !article) throw new Error('Article not found');

  let blocks: ArticleBlock[] = article.blocks ?? [];
  if (blocks.length === 0 && article.content_markdown) {
    blocks = markdownToBlocks(article.content_markdown);
  }

  const read_time_minutes = calculateReadTime(blocks);

  const { data, error } = await supabaseAdmin
    .from('articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      blocks,
      read_time_minutes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`publishArticle: ${error.message}`);

  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  revalidatePath(`/pro/blog/${data.slug}`);
  revalidatePath(`/blog/${data.slug}`);

  return data;
}

export async function unpublishArticle(id: string) {
  await adminGuard();

  const { data, error } = await supabaseAdmin
    .from('articles')
    .update({ status: 'draft', published_at: null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`unpublishArticle: ${error.message}`);

  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  return data;
}

export async function deleteArticle(id: string) {
  await adminGuard();

  const { data: article } = await supabaseAdmin
    .from('articles')
    .select('slug')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`deleteArticle: ${error.message}`);

  revalidatePath('/admin/blog');
  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  if (article?.slug) {
    revalidatePath(`/pro/blog/${article.slug}`);
    revalidatePath(`/blog/${article.slug}`);
  }
}

export async function getArticles(status?: 'draft' | 'published') {
  const query = supabaseAdmin
    .from('articles')
    .select('id, title, slug, status, category, published_at, read_time_minutes, created_at, template')
    .order('created_at', { ascending: false });

  if (status) query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    // Table may not exist yet (migration pending) — return empty list instead of crashing
    console.error(`getArticles: ${error.message}`);
    return [];
  }
  return data ?? [];
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function getArticleById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function autoSaveArticle(id: string, blocks: ArticleBlock[], title: string) {
  await adminGuard();
  const read_time_minutes = calculateReadTime(blocks);
  await supabaseAdmin
    .from('articles')
    .update({ blocks, title, read_time_minutes })
    .eq('id', id);
}
