'use client';

import { SvgIcon, SvgIconProps } from '@mui/material';

interface IMSLogoProps extends Omit<SvgIconProps, 'children'> {
  size?: 'small' | 'medium' | 'large';
}

export function IMSLogo({ size = 'medium', ...props }: IMSLogoProps) {
  const sizeMap = {
    small: { fontSize: '1.5rem' },
    medium: { fontSize: '2rem' },
    large: { fontSize: '3rem' },
  };

  return (
    <SvgIcon
      {...props}
      sx={{
        ...sizeMap[size],
        ...props.sx,
      }}
      viewBox="0 0 120 40"
    >
      {/* I - Inventory */}
      <rect x="8" y="8" width="4" height="24" fill="currentColor" />
      <rect x="6" y="8" width="8" height="3" fill="currentColor" />
      <rect x="6" y="29" width="8" height="3" fill="currentColor" />

      {/* M - Management */}
      <rect x="24" y="8" width="4" height="24" fill="currentColor" />
      <rect x="36" y="8" width="4" height="24" fill="currentColor" />
      <polygon points="28,8 32,8 34,16 36,8 32,16 28,16" fill="currentColor" />

      {/* S - System */}
      <path
        d="M 52 11 
           Q 52 8 55 8 
           L 62 8 
           Q 65 8 65 11 
           Q 65 14 62 14 
           L 58 14 
           Q 55 14 55 17 
           Q 55 20 58 20 
           L 62 20 
           Q 65 20 65 23 
           Q 65 26 62 26 
           L 55 26 
           Q 52 26 52 23 
           L 56 23 
           Q 56 23 58 23 
           L 61 23 
           Q 61 23 61 20 
           Q 61 17 58 17 
           L 55 17 
           Q 52 17 52 14 
           Q 52 11 55 11 
           L 58 11 
           Q 61 11 61 14 
           L 65 14"
        fill="currentColor"
      />

      {/* Decorative elements */}
      <circle cx="76" cy="12" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="82" cy="20" r="1.5" fill="currentColor" opacity="0.4" />
      <circle cx="76" cy="28" r="2" fill="currentColor" opacity="0.6" />
    </SvgIcon>
  );
}
