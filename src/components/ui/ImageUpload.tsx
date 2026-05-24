'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { ImagePreview } from './ImagePreview';
import { ImageCropper } from './ImageCropper';
import {
  uploadItemImage,
  deleteItemImage,
  validateImageFile,
} from '@/lib/utils/imageUpload';

interface ImageUploadProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  userId: string;
  itemId?: string;
  disabled?: boolean;
  size?: number;
}

export function ImageUpload({
  value,
  onChange,
  userId,
  itemId,
  disabled = false,
  size = 80,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Create object URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageSrc(imageUrl);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setUploading(true);

    try {
      // Delete existing image if present
      if (value) {
        await deleteItemImage(value);
      }

      // Create a File object from the cropped blob
      const croppedFile = new File([croppedBlob], 'cropped-image.webp', {
        type: 'image/webp',
      });

      // Upload cropped image
      const result = await uploadItemImage(croppedFile, userId, itemId);

      if (result.success && result.url) {
        onChange(result.url);
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
      // Clean up object URL
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc('');
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // Clean up object URL
    URL.revokeObjectURL(selectedImageSrc);
    setSelectedImageSrc('');
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!value) return;

    setUploading(true);
    setError(null);

    try {
      const success = await deleteItemImage(value);
      if (success) {
        onChange(null);
      } else {
        setError('Failed to remove image');
      }
    } catch (err) {
      setError('Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        {/* Image Preview */}
        <Box sx={{ position: 'relative' }}>
          <ImagePreview
            src={value}
            alt="Item image"
            size={size}
            onClick={!disabled ? handleFileSelect : undefined}
          />

          {/* Loading Overlay */}
          {uploading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 1,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        {/* Upload/Edit/Delete Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {!value ? (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleFileSelect}
              disabled={disabled || uploading}
              size="small"
            >
              Upload Image
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handleFileSelect}
                disabled={disabled || uploading}
                size="small"
                color="primary"
                title="Change image"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={handleRemoveImage}
                disabled={disabled || uploading}
                size="small"
                color="error"
                title="Remove image"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Helper Text */}
      <Typography variant="caption" color="text.secondary" display="block">
        Supported: JPEG, PNG, WebP (max 10MB). You can crop and resize images
        before uploading.
      </Typography>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={showCropper}
        imageSrc={selectedImageSrc}
        onCrop={handleCropComplete}
        onCancel={handleCropCancel}
        aspectRatio={1} // Square crop for item images
      />
    </Box>
  );
}
