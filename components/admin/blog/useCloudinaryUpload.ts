import { useState } from 'react';

interface UploadResult {
  publicId: string;
  url: string;
}

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<UploadResult | null> {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées (JPG, PNG, WebP…)');
      return null;
    }

    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      setError(`Image trop lourde : ${sizeMB} Mo (max ${MAX_MB} Mo). Compresse l'image avant de l'uploader.`);
      return null;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/blog/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        return null;
      }

      return data as UploadResult;
    } catch {
      setError('Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
