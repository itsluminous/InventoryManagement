'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Crop as CropIcon } from '@mui/icons-material';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Resizer from 'react-image-file-resizer';

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  loading?: boolean;
  onError?: (error: string) => void;
}

export function ImageCropper({
  open,
  imageSrc,
  onCrop,
  onCancel,
  loading = false,
  onError,
}: ImageCropperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const imgRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      if (onError) {
        onError('Please select a crop area');
      }
      return;
    }

    try {
      // Create canvas and crop the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      // Convert canvas to blob
      canvas.toBlob(
        blob => {
          if (!blob) {
            if (onError) onError('Failed to create cropped image');
            return;
          }

          // Resize the cropped image
          Resizer.imageFileResizer(
            blob,
            320, // maxWidth
            320, // maxHeight
            'WEBP', // format
            80, // quality
            0, // rotation
            resizedBlob => {
              onCrop(resizedBlob as Blob);
            },
            'blob'
          );
        },
        'image/webp',
        0.9
      );
    } catch (error) {
      console.error('Error cropping image:', error);
      if (onError) {
        onError(
          error instanceof Error ? error.message : 'Failed to crop image'
        );
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CropIcon />
          Crop Image
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: 400 }}>
          <ReactCrop
            crop={crop}
            onChange={setCrop}
            onComplete={setCompletedCrop}
            aspect={1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              style={{ maxWidth: '100%', maxHeight: '400px' }}
            />
          </ReactCrop>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Processing...</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          disabled={loading || !completedCrop}
        >
          {loading ? 'Processing...' : 'Crop & Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
