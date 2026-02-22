/**
 * Property-Based Tests for Responsive Branding Display
 *
 * For any viewport size, the system should display appropriate branding
 * (IMS for mobile, full name for desktop) with consistent styling and
 * maintain brand identity across all screen sizes.
 */

import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Logo } from '../Logo';
import * as fc from 'fast-check';

// Mock useMediaQuery for testing different viewport sizes
const mockUseMediaQuery = jest.fn();
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => mockUseMediaQuery(),
}));

// Test wrapper with theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('Logo Component - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 19: Responsive Branding Display
   * Tests that the logo displays appropriate content based on viewport size
   */
  it('should display appropriate branding based on viewport size', () => {
    fc.assert(
      fc.property(
        fc.record({
          isMobile: fc.boolean(),
          variant: fc.constantFrom('auto', 'mobile', 'desktop') as fc.Arbitrary<
            'auto' | 'mobile' | 'desktop'
          >,
          size: fc.constantFrom('small', 'medium', 'large') as fc.Arbitrary<
            'small' | 'medium' | 'large'
          >,
          responsive: fc.boolean(),
        }),
        ({ isMobile, variant, size, responsive }) => {
          // Setup mock for viewport size
          mockUseMediaQuery.mockReturnValue(isMobile);

          const { container } = render(
            <TestWrapper>
              <Logo variant={variant} size={size} responsive={responsive} />
            </TestWrapper>
          );

          // Determine expected behavior
          const shouldShowMobile =
            variant === 'mobile' ||
            (variant === 'auto' && responsive && isMobile);

          if (shouldShowMobile) {
            // Mobile variant should show "IMS" with styled letters
            const imsText = container.textContent;
            expect(imsText).toContain('I');
            expect(imsText).toContain('M');
            expect(imsText).toContain('S');

            // Should not contain full words when in mobile mode
            if (
              variant === 'mobile' ||
              (variant === 'auto' && isMobile && responsive)
            ) {
              expect(imsText).not.toContain('Inventory');
              expect(imsText).not.toContain('Management');
              expect(imsText).not.toContain('System');
            }
          } else {
            // Desktop variant should show full name
            const fullText = container.textContent;
            expect(fullText).toContain('Inventory');
            expect(fullText).toContain('Management');
            expect(fullText).toContain('System');
          }

          // Logo should always be present
          const svgElement = container.querySelector('svg');
          expect(svgElement).toBeInTheDocument();

          // Component should render without errors
          expect(container.firstChild).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Logo size consistency
   * Tests that logo size prop affects the rendered component appropriately
   */
  it('should maintain consistent sizing across different size props', () => {
    fc.assert(
      fc.property(
        fc.record({
          size: fc.constantFrom('small', 'medium', 'large') as fc.Arbitrary<
            'small' | 'medium' | 'large'
          >,
          isMobile: fc.boolean(),
        }),
        ({ size, isMobile }) => {
          mockUseMediaQuery.mockReturnValue(isMobile);

          const { container } = render(
            <TestWrapper>
              <Logo size={size} />
            </TestWrapper>
          );

          // Logo should render with appropriate size
          const svgElement = container.querySelector('svg');
          expect(svgElement).toBeInTheDocument();

          // Text should be present (either IMS or full name)
          const textContent = container.textContent;
          expect(textContent).toBeTruthy();
          expect(textContent.length).toBeGreaterThan(0);

          // Component should maintain structure regardless of size
          expect(container.firstChild).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Click handler consistency
   * Tests that onClick behavior is consistent across all configurations
   */
  it('should handle click events consistently across all variants', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('auto', 'mobile', 'desktop') as fc.Arbitrary<
            'auto' | 'mobile' | 'desktop'
          >,
          isMobile: fc.boolean(),
          hasClickHandler: fc.boolean(),
        }),
        ({ variant, isMobile, hasClickHandler }) => {
          mockUseMediaQuery.mockReturnValue(isMobile);

          const mockOnClick = hasClickHandler ? jest.fn() : undefined;

          const { container } = render(
            <TestWrapper>
              <Logo variant={variant} onClick={mockOnClick} />
            </TestWrapper>
          );

          const logoContainer = container.firstChild as HTMLElement;
          expect(logoContainer).toBeInTheDocument();

          // Check cursor style based on click handler presence
          if (hasClickHandler) {
            expect(logoContainer).toHaveStyle('cursor: pointer');
          } else {
            expect(logoContainer).toHaveStyle('cursor: default');
          }

          // Component should render consistently regardless of click handler
          expect(container.textContent).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Brand identity consistency
   * Tests that brand colors and styling are consistent across all variants
   */
  it('should maintain consistent brand identity across all configurations', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('auto', 'mobile', 'desktop') as fc.Arbitrary<
            'auto' | 'mobile' | 'desktop'
          >,
          size: fc.constantFrom('small', 'medium', 'large') as fc.Arbitrary<
            'small' | 'medium' | 'large'
          >,
          isMobile: fc.boolean(),
          showFullName: fc.option(fc.boolean()),
        }),
        ({ variant, size, isMobile, showFullName }) => {
          mockUseMediaQuery.mockReturnValue(isMobile);

          const { container } = render(
            <TestWrapper>
              <Logo
                variant={variant}
                size={size}
                showFullName={showFullName ?? undefined}
              />
            </TestWrapper>
          );

          // SVG logo should always be present
          const svgElement = container.querySelector('svg');
          expect(svgElement).toBeInTheDocument();

          // Text content should always be present
          const textContent = container.textContent;
          expect(textContent).toBeTruthy();

          // Should contain at least the core brand letters I, M, S
          expect(textContent).toMatch(/[IMS]/);

          // Component structure should be consistent
          const logoContainer = container.firstChild;
          expect(logoContainer).toBeInTheDocument();
          expect(logoContainer).toHaveStyle('display: flex');
          expect(logoContainer).toHaveStyle('align-items: center');
        }
      ),
      { numRuns: 100 }
    );
  });
});
