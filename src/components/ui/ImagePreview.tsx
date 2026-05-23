'use client';

import { useState } from 'react';
import {
  Box,
  Dialog,
  IconButton,
  Backdrop,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon, Image as ImageIcon } from '@mui/icons-material';
import { OptimizedImage } from '@/components/layout/OptimizedImage';

interface ImagePreviewProps {
  src?: string | null;
  alt: string;
  size?: number;
  onClick?: () => void;
}

export function ImagePreview({
  src,
  alt,
  size = 48,
  onClick,
}: ImagePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleImageClick = () => {
    if (onClick) {
      onClick();
    } else if (src) {
      setPreviewOpen(true);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    // Close on backdrop click
    if (event.target === event.currentTarget) {
      handleClosePreview();
    }
  };

  return (
    <>
      {/* Image Square */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 1,
          overflow: 'hidden',
          cursor: src ? 'pointer' : 'default',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: src ? 'transparent' : 'grey.100',
          transition: 'all 0.2s ease-in-out',
          '&:hover': src
            ? {
                transform: 'scale(1.05)',
                boxShadow: theme.shadows[4],
              }
            : {},
        }}
        onClick={handleImageClick}
      >
        {src ? (
          <OptimizedImage
            src={src}
            alt={alt}
            width={size}
            height={size}
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
            quality={90}
          />
        ) : (
          <ImageIcon
            sx={{
              color: 'grey.400',
              fontSize: size * 0.4,
            }}
          />
        )}
      </Box>

      {/* Full Screen Preview Dialog */}
      {src && (
        <Dialog
          open={previewOpen}
          onClose={handleClosePreview}
          maxWidth={false}
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              bgcolor: 'transparent',
              boxShadow: 'none',
              overflow: 'hidden',
            },
          }}
          BackdropComponent={Backdrop}
          BackdropProps={{
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
            },
            onClick: handleBackdropClick,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: isMobile ? '100vh' : '80vh',
              minWidth: isMobile ? '100vw' : '80vw',
              p: isMobile ? 2 : 4,
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={handleClosePreview}
              sx={{
                position: 'absolute',
                top: isMobile ? 16 : 24,
                right: isMobile ? 16 : 24,
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
                zIndex: 1,
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Full Size Image */}
            <Box
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <OptimizedImage
                src={src}
                alt={alt}
                width={800}
                height={600}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: theme.shape.borderRadius,
                }}
                quality={95}
                priority
              />
            </Box>
          </Box>
        </Dialog>
      )}
    </>
  );
}
