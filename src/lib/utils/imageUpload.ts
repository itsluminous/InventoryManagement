/**
 * Image upload utilities with client-side compression and WebP conversion
 */

import { createClient } from '@/lib/supabase/client';

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Compress and convert image to WebP format
 */
export async function compressImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 320,
    maxHeight = 320,
    quality = 0.8,
    format = 'webp',
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadItemImage(
  file: File,
  userId: string,
  itemId?: string
): Promise<ImageUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Please select a valid image file' };
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'Image size must be less than 10MB' };
    }

    // Compress image
    const compressedBlob = await compressImage(file, {
      maxWidth: 320,
      maxHeight: 320,
      quality: 0.8,
      format: 'webp',
    });

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${userId}/${itemId || randomId}_${timestamp}.webp`;

    // Upload to Supabase Storage
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(fileName, compressedBlob, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Failed to upload image' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Image upload error:', error);
    return { success: false, error: 'Failed to process image' };
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteItemImage(imageUrl: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderName = pathParts[pathParts.length - 2];
    const filePath = `${folderName}/${fileName}`;

    const { error } = await supabase.storage
      .from('item-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Image delete error:', error);
    return false;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): string | null {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file';
  }

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return 'Image size must be less than 10MB';
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return 'Supported formats: JPEG, PNG, WebP';
  }

  return null;
}
