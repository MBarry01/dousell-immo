import { useState } from 'react';

interface UploadResult {
  publicId: string;
  url: string;
}

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<UploadResult | null> {
    setUploading(true);
    setError(null);
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
