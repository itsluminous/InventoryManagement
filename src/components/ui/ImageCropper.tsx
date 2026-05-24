'use client';

import { useState, useRef, useEffect } from 'react';
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
  imageFile: File; // Always require the file for mobile compatibility
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  loading?: boolean;
  onError?: (error: string) => void;
}

export function ImageCropper({
  open,
  imageFile,
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
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);

  // Convert file to data URL when dialog opens (more reliable than blob URLs on mobile)
  useEffect(() => {
    if (open && imageFile) {
      setImageLoading(true);
      const reader = new FileReader();

      reader.onload = e => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setImageSrc(result);
        }
        setImageLoading(false);
      };

      reader.onerror = () => {
        console.error('Failed to read file');
        if (onError) onError('Failed to read image file');
        setImageLoading(false);
      };

      reader.readAsDataURL(imageFile);

      return () => {
        setImageSrc('');
        setImageLoading(false);
      };
    }
  }, [open, imageFile, onError]);

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

      // Ensure image is loaded
      if (!image.complete || image.naturalWidth === 0) {
        throw new Error('Image not fully loaded');
      }

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
            // Fallback: try to process the original file if cropping fails
            console.warn('Canvas toBlob failed, using original file');
            handleFallbackProcessing();
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
      // Fallback: try to process the original file
      handleFallbackProcessing();
    }
  };

  const handleFallbackProcessing = () => {
    console.log('Using fallback processing for original file');
    try {
      // Process the original file directly with resizing
      Resizer.imageFileResizer(
        imageFile,
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
    } catch (fallbackError) {
      console.error('Fallback processing failed:', fallbackError);
      if (onError) {
        onError('Failed to process image. Please try a different image.');
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
          {imageLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography>Loading image...</Typography>
            </Box>
          ) : imageSrc ? (
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
                onError={() => {
                  console.error('Image failed to load');
                  if (onError) onError('Failed to load image for cropping');
                }}
                onLoad={() => {
                  // Image loaded successfully, we can enable cropping
                  console.log('Image loaded successfully');
                }}
              />
            </ReactCrop>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
              }}
            >
              <Typography>Preparing image...</Typography>
            </Box>
          )}
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
        {isMobile && (
          <Button
            onClick={handleFallbackProcessing}
            disabled={loading || imageLoading}
            color="secondary"
          >
            Skip Crop
          </Button>
        )}
        <Button
          onClick={handleCrop}
          variant="contained"
          disabled={loading || !completedCrop || !imageSrc || imageLoading}
        >
          {loading ? 'Processing...' : 'Crop & Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
