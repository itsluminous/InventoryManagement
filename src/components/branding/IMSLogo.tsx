'use client';

import Image from 'next/image';
import { Box } from '@mui/material';

interface IMSLogoProps {
  size?: 'small' | 'medium' | 'large';
  sx?: object;
}

export function IMSLogo({ size = 'medium', sx, ...props }: IMSLogoProps) {
  const sizeMap = {
    small: 24,
    medium: 32,
    large: 48,
  };

  const logoSize = sizeMap[size];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...props}
    >
      <Image
        src="/inventory-icon.png"
        alt="Inventory Management System Logo"
        width={logoSize}
        height={logoSize}
        style={{
          objectFit: 'contain',
        }}
        priority
      />
    </Box>
  );
}
