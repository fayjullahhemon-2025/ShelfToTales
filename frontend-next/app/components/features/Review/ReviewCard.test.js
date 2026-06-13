import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewCard from './ReviewCard';

vi.mock('./ReportButton', () => ({
  default: () => null,
}));

const baseProps = {
  id: 42,
  title: 'Curious Reader',
  comment: 'The killer turns out to be the librarian in chapter 12.',
  date: '2026-06-13T10:00:00Z',
  rating: 4,
  avatar: '',
  isSpoiler: false,
};

describe('ReviewCard', () => {
  it('renders the comment text plainly when not flagged as spoiler', () => {
    render(<ReviewCard {...baseProps} />);
    expect(screen.getByText(/The killer turns out to be/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reveal spoiler/i })).not.toBeInTheDocument();
  });

  it('hides the comment behind a spoiler overlay when isSpoiler is true', () => {
    render(<ReviewCard {...baseProps} isSpoiler comment="The killer is revealed on the last page." />);
    // The overlay is the click target
    const overlay = screen.getByRole('button', { name: /reveal spoiler/i });
    expect(overlay).toBeInTheDocument();
    // Comment text still in the DOM (it's blurred, not removed)
    expect(screen.getByText(/The killer is revealed/)).toBeInTheDocument();
  });

  it('reveals the comment when the user clicks the overlay', async () => {
    const user = userEvent.setup();
    render(<ReviewCard {...baseProps} isSpoiler />);
    const overlay = screen.getByRole('button', { name: /reveal spoiler/i });
    await user.click(overlay);
    expect(overlay).not.toBeInTheDocument();
    expect(screen.getByText(/The killer turns out to be/)).toBeInTheDocument();
  });
});
