'use client';

import React from 'react';
import { Box, Fade, Slide, Zoom, Collapse } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { keyframes } from '@emotion/react';

// Custom animation keyframes
const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const staggeredFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Reusable transition components
interface AnimatedBoxProps {
  children: React.ReactNode;
  animation?: 'slideUp' | 'slideRight' | 'scaleIn' | 'fadeIn';
  delay?: number;
  duration?: number;
  sx?: Record<string, unknown>;
}

export function AnimatedBox({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 0.3,
  sx = {},
}: AnimatedBoxProps) {
  const getAnimation = () => {
    switch (animation) {
      case 'slideUp':
        return slideInUp;
      case 'slideRight':
        return slideInRight;
      case 'scaleIn':
        return scaleIn;
      default:
        return staggeredFadeIn;
    }
  };

  return (
    <Box
      sx={{
        animation: `${getAnimation()} ${duration}s ease-out ${delay}s both`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// Staggered list animation
interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animation?: 'slideUp' | 'slideRight' | 'scaleIn' | 'fadeIn';
}

export function StaggeredList({
  children,
  staggerDelay = 0.1,
  animation = 'slideUp',
}: StaggeredListProps) {
  return (
    <>
      {children.map((child, index) => (
        <AnimatedBox
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          duration={0.4}
        >
          {child}
        </AnimatedBox>
      ))}
    </>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function PageTransition({
  children,
  direction = 'up',
}: PageTransitionProps) {
  return (
    <Slide direction={direction} in={true} mountOnEnter unmountOnExit>
      <Box
        sx={{
          animation: `${slideInUp} 0.4s ease-out`,
          position: 'relative',
          zIndex: 0, // Ensure this doesn't create a new stacking context above fixed elements
        }}
      >
        {children}
      </Box>
    </Slide>
  );
}

// Modal transition
export const ModalTransition = React.forwardRef<
  HTMLDivElement,
  TransitionProps & { children: React.ReactElement }
>(function ModalTransition(props, ref) {
  return (
    <Zoom ref={ref} {...props} timeout={200}>
      {props.children}
    </Zoom>
  );
});

// Drawer transition
export const DrawerTransition = React.forwardRef<
  HTMLDivElement,
  TransitionProps & { children: React.ReactElement }
>(function DrawerTransition(props, ref) {
  return (
    <Slide direction="up" ref={ref} {...props} timeout={300}>
      {props.children}
    </Slide>
  );
});

// Collapse transition for expandable content
interface ExpandableContentProps {
  expanded: boolean;
  children: React.ReactNode;
}

export function ExpandableContent({
  expanded,
  children,
}: ExpandableContentProps) {
  return (
    <Collapse in={expanded} timeout={300}>
      <Box
        sx={{
          pt: expanded ? 2 : 0,
          animation: expanded ? `${slideInUp} 0.3s ease-out` : undefined,
        }}
      >
        {children}
      </Box>
    </Collapse>
  );
}

// Fade transition for content switching
interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  timeout?: number;
}

export function FadeTransition({
  show,
  children,
  timeout = 300,
}: FadeTransitionProps) {
  return (
    <Fade in={show} timeout={timeout}>
      <Box
        sx={{
          animation: show ? `${staggeredFadeIn} 0.3s ease-out` : undefined,
        }}
      >
        {children}
      </Box>
    </Fade>
  );
}
