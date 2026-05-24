'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Crop as CropIcon } from '@mui/icons-material';
import Cropper, { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height ratio, 1 for square
  loading?: boolean; // Add loading prop
  onError?: (error: string) => void; // Add error callback
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => {
      console.error('Image load error:', error);
      reject(new Error('Failed to load image for cropping'));
    });

    // Only set crossOrigin for external URLs, not for blob or data URLs
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }

    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise(resolve => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        }
      },
      'image/webp',
      0.9
    );
  });
};

export function ImageCropper({
  open,
  imageSrc,
  onCrop,
  onCancel,
  aspectRatio = 1, // Default to square crop
  loading = false,
  onError,
}: ImageCropperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCrop(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
      let errorMessage = 'Failed to crop image';

      if (error instanceof Error) {
        if (error.message.includes('Failed to load image')) {
          errorMessage =
            'Image could not be loaded for cropping. Please try selecting the image again.';
        } else {
          errorMessage = error.message;
        }
      }

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [imageSrc, croppedAreaPixels, onCrop, onError]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100vh' : '80vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CropIcon />
          Crop Image
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', flex: 1 }}>
        {/* Cropper Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: 400,
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{
              containerStyle: {
                backgroundColor: theme.palette.background.default,
              },
              cropAreaStyle: {
                border: `2px solid ${theme.palette.primary.main}`,
              },
            }}
          />

          {/* Loading Overlay */}
          {loading && (
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
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 1000,
              }}
            >
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <CircularProgress size={48} sx={{ color: 'white', mb: 2 }} />
                <Typography variant="body1">Processing image...</Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Controls */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
          }}
        >
          <Typography variant="body2" gutterBottom>
            Zoom: {Math.round(zoom * 100)}%
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value as number)}
            disabled={loading}
            sx={{
              color: 'white',
              '& .MuiSlider-thumb': {
                bgcolor: theme.palette.primary.main,
              },
              '& .MuiSlider-track': {
                bgcolor: theme.palette.primary.main,
              },
            }}
          />
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Drag to reposition • Pinch or scroll to zoom
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          disabled={loading || !croppedAreaPixels}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Processing...' : 'Crop & Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
