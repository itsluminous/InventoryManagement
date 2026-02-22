'use client';

import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Box } from '@mui/material';
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
  responsive = true,
  onClick,
}: Omit<LogoProps, 'showFullName'>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Determine if we should show mobile or desktop variant
  const shouldShowMobile =
    variant === 'mobile' || (variant === 'auto' && responsive && isMobile);

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
        gap: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      <IMSLogo size={size} />

      {/* Desktop view - show full "Inventory Management System" */}
      {!shouldShowMobile && (
        <Typography
          variant={size === 'large' ? 'h4' : size === 'small' ? 'body1' : 'h6'}
          component="span"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '-0.025em',
          }}
        >
          Inventory Management System
        </Typography>
      )}

      {/* Mobile view - show just "Inventory" */}
      {shouldShowMobile && (
        <Typography
          variant={size === 'large' ? 'h5' : size === 'small' ? 'body1' : 'h6'}
          component="span"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '-0.025em',
          }}
        >
          Inventory
        </Typography>
      )}
    </Box>
  );
}
