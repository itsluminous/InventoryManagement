/**
 * Tests for ImagePreview component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ImagePreview } from '../ImagePreview';

// Mock the OptimizedImage component
jest.mock('@/components/layout/OptimizedImage', () => ({
  OptimizedImage: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock MUI theme
const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ImagePreview', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render placeholder when no image URL provided', () => {
    renderWithTheme(
      <ImagePreview
        src={null}
        alt="Test item"
        size={48}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByTestId('ImageIcon')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should render placeholder when empty image URL provided', () => {
    renderWithTheme(
      <ImagePreview src="" alt="Test item" size={48} onClick={mockOnClick} />
    );

    expect(screen.getByTestId('ImageIcon')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should render image when valid URL provided', () => {
    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt="Test item"
        size={48}
        onClick={mockOnClick}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test item');
  });

  it('should call onClick when image is clicked', () => {
    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt="Test item"
        size={48}
        onClick={mockOnClick}
      />
    );

    const container = screen.getByRole('img').parentElement;
    fireEvent.click(container!);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when placeholder is clicked', () => {
    renderWithTheme(
      <ImagePreview
        src={null}
        alt="Test item"
        size={48}
        onClick={mockOnClick}
      />
    );

    const icon = screen.getByTestId('ImageIcon');
    const container = icon.parentElement;
    fireEvent.click(container!);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should open preview dialog when image is clicked without onClick prop', () => {
    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt="Test item"
        size={48}
      />
    );

    const container = screen.getByRole('img').parentElement;
    fireEvent.click(container!);

    // Should open dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not open preview dialog when no image src', () => {
    renderWithTheme(<ImagePreview src={null} alt="Test item" size={48} />);

    const icon = screen.getByTestId('ImageIcon');
    const container = icon.parentElement;
    fireEvent.click(container!);

    // Should not open dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close preview dialog when close button is clicked', async () => {
    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt="Test item"
        size={48}
      />
    );

    // Open dialog
    const container = screen.getByRole('img').parentElement;
    fireEvent.click(container!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close dialog
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    // Wait for dialog to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should handle special characters in alt text', () => {
    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt="Test item with special chars: @#$%"
        size={48}
        onClick={mockOnClick}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Test item with special chars: @#$%');
  });

  it('should handle long alt text', () => {
    const longAlt =
      'This is a very long alt text that describes the image in great detail with many words';

    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt={longAlt}
        size={48}
        onClick={mockOnClick}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', longAlt);
  });

  it('should use default size when not provided', () => {
    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt="Test item"
        onClick={mockOnClick}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('should handle empty onClick gracefully', () => {
    renderWithTheme(
      <ImagePreview
        src="https://example.com/image.jpg"
        alt="Test item"
        size={48}
      />
    );

    const container = screen.getByRole('img').parentElement;

    // Should not throw error when clicking without onClick prop
    expect(() => fireEvent.click(container!)).not.toThrow();
  });

  it('should show placeholder icon when no image', () => {
    renderWithTheme(<ImagePreview src={null} alt="Test item" size={48} />);

    const icon = screen.getByTestId('ImageIcon');
    expect(icon).toBeInTheDocument();
  });

  it('should handle undefined src', () => {
    renderWithTheme(<ImagePreview src={undefined} alt="Test item" size={48} />);

    expect(screen.getByTestId('ImageIcon')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
