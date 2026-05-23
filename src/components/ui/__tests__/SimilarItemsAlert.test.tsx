/**
 * Tests for SimilarItemsAlert component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SimilarItemsAlert } from '../SimilarItemsAlert';
import { FuzzyMatchResult } from '@/lib/utils/fuzzyMatch';
import { MasterItem } from '@/lib/database';

// Mock MUI theme
const theme = createTheme();

// Mock data
const mockMasterItems: MasterItem[] = [
  {
    id: '1',
    user_id: 'user-123',
    name: 'Steel Balti',
    unit: 'pcs',
    image_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user-123',
    name: 'Balti Steel',
    unit: 'pcs',
    image_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'user-123',
    name: 'Steel Pot',
    unit: 'pcs',
    image_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockSimilarItems: FuzzyMatchResult<MasterItem>[] = [
  {
    item: mockMasterItems[0],
    score: 0.85,
    matchedWords: ['steel'],
  },
  {
    item: mockMasterItems[1],
    score: 0.8,
    matchedWords: ['steel', 'balti'],
  },
  {
    item: mockMasterItems[2],
    score: 0.75,
    matchedWords: ['steel'],
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('SimilarItemsAlert', () => {
  const mockOnItemClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when no similar items', () => {
    const { container } = renderWithTheme(
      <SimilarItemsAlert similarItems={[]} onItemClick={mockOnItemClick} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render alert when similar items exist', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(
      screen.getByText(
        'Similar items found. Click to edit existing item instead:'
      )
    ).toBeInTheDocument();
  });

  it('should display all similar items as chips', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText('Steel Balti')).toBeInTheDocument();
    expect(screen.getByText('Balti Steel')).toBeInTheDocument();
    expect(screen.getByText('Steel Pot')).toBeInTheDocument();
  });

  it('should display similarity scores', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText(/Steel Balti \(85%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Balti Steel \(80%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Steel Pot \(75%\)/)).toBeInTheDocument();
  });

  it('should call onItemClick when chip is clicked', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    const steelBaltiChip = screen.getByText('Steel Balti');
    fireEvent.click(steelBaltiChip);

    expect(mockOnItemClick).toHaveBeenCalledWith(mockMasterItems[0]);
  });

  it('should call onItemClick with correct item for each chip', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    // Click on different chips
    fireEvent.click(screen.getByText('Steel Balti'));
    expect(mockOnItemClick).toHaveBeenCalledWith(mockMasterItems[0]);

    fireEvent.click(screen.getByText('Balti Steel'));
    expect(mockOnItemClick).toHaveBeenCalledWith(mockMasterItems[1]);

    fireEvent.click(screen.getByText('Steel Pot'));
    expect(mockOnItemClick).toHaveBeenCalledWith(mockMasterItems[2]);

    expect(mockOnItemClick).toHaveBeenCalledTimes(3);
  });

  it('should render warning icon', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    // Check for warning icon (MUI uses data-testid for icons)
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('should have proper styling for warning alert', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardWarning');
  });

  it('should handle single similar item', () => {
    const singleItem = [mockSimilarItems[0]];

    renderWithTheme(
      <SimilarItemsAlert
        similarItems={singleItem}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText('Steel Balti')).toBeInTheDocument();
    expect(screen.queryByText('Balti Steel')).not.toBeInTheDocument();
    expect(screen.queryByText('Steel Pot')).not.toBeInTheDocument();
  });

  it('should handle items with special characters in names', () => {
    const specialItems: FuzzyMatchResult<MasterItem>[] = [
      {
        item: {
          ...mockMasterItems[0],
          name: 'Steel-Balti & Co.',
        },
        score: 0.85,
        matchedWords: ['steel'],
      },
    ];

    renderWithTheme(
      <SimilarItemsAlert
        similarItems={specialItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText('Steel-Balti & Co.')).toBeInTheDocument();
  });

  it('should handle very long item names', () => {
    const longNameItems: FuzzyMatchResult<MasterItem>[] = [
      {
        item: {
          ...mockMasterItems[0],
          name: 'Very Long Steel Balti Container With Multiple Words And Descriptions',
        },
        score: 0.85,
        matchedWords: ['steel'],
      },
    ];

    renderWithTheme(
      <SimilarItemsAlert
        similarItems={longNameItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(
      screen.getByText(
        'Very Long Steel Balti Container With Multiple Words And Descriptions'
      )
    ).toBeInTheDocument();
  });

  it('should handle zero similarity score', () => {
    const zeroScoreItems: FuzzyMatchResult<MasterItem>[] = [
      {
        item: mockMasterItems[0],
        score: 0,
        matchedWords: [],
      },
    ];

    renderWithTheme(
      <SimilarItemsAlert
        similarItems={zeroScoreItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText(/Steel Balti \(0%\)/)).toBeInTheDocument();
  });

  it('should handle perfect similarity score', () => {
    const perfectScoreItems: FuzzyMatchResult<MasterItem>[] = [
      {
        item: mockMasterItems[0],
        score: 1.0,
        matchedWords: ['steel', 'balti'],
      },
    ];

    renderWithTheme(
      <SimilarItemsAlert
        similarItems={perfectScoreItems}
        onItemClick={mockOnItemClick}
      />
    );

    expect(screen.getByText(/Steel Balti \(100%\)/)).toBeInTheDocument();
  });

  it('should be accessible', () => {
    renderWithTheme(
      <SimilarItemsAlert
        similarItems={mockSimilarItems}
        onItemClick={mockOnItemClick}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();

    // Check that chips are clickable buttons
    const chips = screen.getAllByRole('button');
    expect(chips.length).toBe(3);

    chips.forEach(chip => {
      expect(chip).toBeInTheDocument();
    });
  });
});
