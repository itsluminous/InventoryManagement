import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageCropper } from '../ImageCropper';

// Mock react-easy-crop
jest.mock('react-easy-crop', () => {
  return function MockCropper({ onCropComplete }: any) {
    // Simulate crop completion
    React.useEffect(() => {
      if (onCropComplete) {
        onCropComplete(
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 0, y: 0, width: 100, height: 100 }
        );
      }
    }, [onCropComplete]);

    return <div data-testid="mock-cropper">Mock Cropper</div>;
  };
});

// Mock canvas operations
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    drawImage: jest.fn(),
  }),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: function (callback: (blob: Blob) => void) {
    callback(new Blob(['test'], { type: 'image/webp' }));
  },
});

describe('ImageCropper', () => {
  const defaultProps = {
    open: true,
    imageSrc: 'data:image/jpeg;base64,test',
    onCrop: jest.fn(),
    onCancel: jest.fn(),
    aspectRatio: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the cropper dialog when open', () => {
    render(<ImageCropper {...defaultProps} />);

    expect(screen.getByText('Crop Image')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Crop & Upload')).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(<ImageCropper {...defaultProps} loading={true} />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Processing image...')).toBeInTheDocument();
  });

  it('should disable buttons when loading', () => {
    render(<ImageCropper {...defaultProps} loading={true} />);

    const cancelButton = screen.getByText('Cancel');
    const cropButton = screen.getByText('Processing...');

    expect(cancelButton).toBeDisabled();
    expect(cropButton).toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<ImageCropper {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('should handle error callback when provided', () => {
    const onError = jest.fn();
    render(<ImageCropper {...defaultProps} onError={onError} />);

    // Test that the component accepts the onError prop without throwing
    expect(screen.getByText('Crop & Upload')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<ImageCropper {...defaultProps} open={false} />);

    expect(screen.queryByText('Crop Image')).not.toBeInTheDocument();
  });
});
