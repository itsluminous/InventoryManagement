'use client';

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { IMSLogo } from './IMSLogo';

export interface LogoProps {
  variant?: 'mobile' | 'desktop' | 'auto';
  size?: 'small' | 'medium' | 'large';
  showFullName?: boolean;
  responsive?: boolean;
  onClick?: () => void;
}

export function Logo({
  variant = 'auto',
  size = 'medium',
  showFullName,
  responsive = true,
  onClick,
}: LogoProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine if we should show mobile or desktop variant
  const shouldShowMobile =
    variant === 'mobile' || (variant === 'auto' && responsive && isMobile);
  const shouldShowFullName = showFullName ?? !shouldShowMobile;

  // Always show some text - either full name or IMS
  const shouldShowIMS = !shouldShowFullName;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      <IMSLogo size={size} />

      {shouldShowFullName && (
        <Typography
          variant={size === 'large' ? 'h4' : size === 'small' ? 'body1' : 'h6'}
          component="span"
          sx={{
            fontWeight: 600,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Box
            component="span"
            sx={{
              color: 'primary.main',
              fontWeight: 'bold',
              fontSize: '1.1em',
            }}
          >
            I
          </Box>
          nventory{' '}
          <Box
            component="span"
            sx={{
              color: 'secondary.main',
              fontWeight: 'bold',
              fontSize: '1.1em',
            }}
          >
            M
          </Box>
          anagement{' '}
          <Box
            component="span"
            sx={{
              color: 'success.main',
              fontWeight: 'bold',
              fontSize: '1.1em',
            }}
          >
            S
          </Box>
          ystem
        </Typography>
      )}

      {shouldShowIMS && (
        <Typography
          variant={size === 'large' ? 'h4' : size === 'small' ? 'body1' : 'h6'}
          component="span"
          sx={{
            fontWeight: 700,
          }}
        >
          <Box component="span" sx={{ color: 'primary.main' }}>
            I
          </Box>
          <Box component="span" sx={{ color: 'secondary.main' }}>
            M
          </Box>
          <Box component="span" sx={{ color: 'success.main' }}>
            S
          </Box>
        </Typography>
      )}
    </Box>
  );
}
