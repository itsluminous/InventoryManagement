'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Box, Skeleton } from '@mui/material';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  className,
  style,
  sizes,
  quality = 85,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <Box
        sx={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          color: 'grey.500',
          fontSize: '0.875rem',
          borderRadius: 1,
        }}
      >
        Image not available
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        overflow: 'hidden',
        borderRadius: 1,
      }}
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        quality={quality}
        sizes={sizes || (fill ? '100vw' : undefined)}
        className={className}
        style={{
          ...style,
          animation: !isLoading ? `${fadeIn} 0.3s ease-out` : undefined,
          objectFit: 'cover',
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </Box>
  );
}

// Lazy loading image component
interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
}

export function LazyImage({ threshold = 0.1, ...props }: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold]);

  return (
    <div ref={setRef}>
      {isInView ? (
        <OptimizedImage {...props} />
      ) : (
        <Skeleton
          variant="rectangular"
          width={props.fill ? '100%' : props.width}
          height={props.fill ? '100%' : props.height}
          sx={{ borderRadius: 1 }}
        />
      )}
    </div>
  );
}

// Generate blur data URL for better loading experience
export function generateBlurDataURL(
  width: number = 10,
  height: number = 10
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Create a simple gradient blur placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}
