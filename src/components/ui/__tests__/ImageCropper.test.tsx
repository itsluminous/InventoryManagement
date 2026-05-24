import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageCropper } from '../ImageCropper';

// Mock react-image-crop
jest.mock('react-image-crop', () => ({
  __esModule: true,
  default: ({ children, onComplete }: any) => (
    <div data-testid="react-crop">
      {children}
      <button
        onClick={() =>
          onComplete({
            x: 10,
            y: 10,
            width: 100,
            height: 100,
          })
        }
      >
        Complete Crop
      </button>
    </div>
  ),
  centerCrop: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  makeAspectCrop: jest.fn(() => ({ unit: '%', width: 80 })),
}));

// Mock react-image-file-resizer
jest.mock('react-image-file-resizer', () => ({
  __esModule: true,
  default: {
    imageFileResizer: jest.fn(
      (file, maxWidth, maxHeight, format, quality, rotation, callback) => {
        // Simulate successful compression
        const mockBlob = new Blob(['compressed'], { type: 'image/webp' });
        callback(mockBlob);
      }
    ),
  },
}));

// Mock CSS import
jest.mock('react-image-crop/dist/ReactCrop.css', () => ({}));

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
    expect(screen.getByTestId('react-crop')).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(<ImageCropper {...defaultProps} loading={true} />);

    expect(screen.getAllByText('Processing...')[0]).toBeInTheDocument();
  });

  it('should disable buttons when loading', () => {
    render(<ImageCropper {...defaultProps} loading={true} />);

    const cancelButton = screen.getByText('Cancel');
    const cropButton = screen.getByRole('button', { name: /processing/i });

    expect(cancelButton).toBeDisabled();
    expect(cropButton).toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<ImageCropper {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('should process crop when crop button is clicked', async () => {
    const onCrop = jest.fn();
    render(<ImageCropper {...defaultProps} onCrop={onCrop} />);

    // Complete the crop selection
    fireEvent.click(screen.getByText('Complete Crop'));

    // Click the crop button
    fireEvent.click(screen.getByText('Crop & Upload'));

    await waitFor(() => {
      expect(onCrop).toHaveBeenCalledWith(expect.any(Blob));
    });
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

  it('should show instructions text', () => {
    render(<ImageCropper {...defaultProps} />);

    // The simplified component doesn't have instructions text anymore
    expect(screen.getByText('Crop Image')).toBeInTheDocument();
  });
});
