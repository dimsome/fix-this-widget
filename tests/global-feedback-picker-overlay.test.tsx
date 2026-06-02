import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackPickerOverlay } from '../src/FeedbackPickerOverlay';

describe('global feedback picker overlay states', () => {
  it('shows picker instructions, cancel action, and highlighted target metadata', () => {
    const onCancel = vi.fn();
    const { rerender } = render(<FeedbackPickerOverlay highlight={null} onCancel={onCancel} />);

    expect(screen.getByText(/Point at an element, then click to attach it/i)).toBeInTheDocument();
    expect(screen.queryByTestId('global-feedback-highlight')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <FeedbackPickerOverlay
        highlight={{
          top: 10,
          left: 20,
          width: 120,
          height: 40,
          x: 24,
          y: 36,
          label: 'Analyze transaction',
          type: 'Button',
        }}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByTestId('global-feedback-highlight')).toHaveStyle({
      top: '10px',
      left: '20px',
      width: '120px',
      height: '40px',
    });
    expect(screen.getByTestId('global-feedback-floatlabel')).toHaveTextContent('Analyze transaction');
    expect(screen.getByTestId('global-feedback-floatlabel')).toHaveTextContent('Button');
  });
});
