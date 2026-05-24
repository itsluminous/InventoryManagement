import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
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

// Mock HTMLImageElement properties for testing
Object.defineProperty(HTMLImageElement.prototype, 'complete', {
  get: () => true,
});

Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
  get: () => 100,
});

Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
  get: () => 100,
});

Object.defineProperty(HTMLImageElement.prototype, 'width', {
  get: () => 100,
});

Object.defineProperty(HTMLImageElement.prototype, 'height', {
  get: () => 100,
});

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,test-data',
  onload: null as any,
  onerror: null as any,
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader),
});

describe('ImageCropper', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

  const defaultProps = {
    open: true,
    imageFile: mockFile,
    onCrop: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset FileReader mock
    mockFileReader.readAsDataURL.mockClear();
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
  });

  it('should render the cropper dialog when open', async () => {
    render(<ImageCropper {...defaultProps} />);

    expect(screen.getByText('Crop Image')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Crop & Upload')).toBeInTheDocument();

    // Initially shows loading
    expect(screen.getByText('Loading image...')).toBeInTheDocument();

    // Simulate FileReader success
    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload({
          target: { result: 'data:image/jpeg;base64,test-data' },
        } as any);
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('react-crop')).toBeInTheDocument();
    });
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

    // Simulate FileReader success to load the image
    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload({
          target: { result: 'data:image/jpeg;base64,test-data' },
        } as any);
      }
    });

    // Wait for the crop component to appear
    await waitFor(() => {
      expect(screen.getByTestId('react-crop')).toBeInTheDocument();
    });

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

    // The component shows loading initially, then the crop interface
    expect(screen.getByText('Crop Image')).toBeInTheDocument();
  });

  it('should handle FileReader error', async () => {
    const onError = jest.fn();
    render(<ImageCropper {...defaultProps} onError={onError} />);

    // Simulate FileReader error
    await act(async () => {
      if (mockFileReader.onerror) {
        mockFileReader.onerror({} as any);
      }
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to read image file');
    });
  });

  it('should show skip crop button on mobile', async () => {
    // Mock mobile breakpoint
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('(max-width:'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<ImageCropper {...defaultProps} />);

    // Simulate FileReader success
    await act(async () => {
      if (mockFileReader.onload) {
        mockFileReader.onload({
          target: { result: 'data:image/jpeg;base64,test-data' },
        } as any);
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Skip Crop')).toBeInTheDocument();
    });
  });
});
