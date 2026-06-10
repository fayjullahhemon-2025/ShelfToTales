import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FriendsPage from './page';
import { friendService, socialService } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  friendService: { getFriends: vi.fn(), getRequests: vi.fn(), getStatus: vi.fn() },
  socialService: { search: vi.fn() },
}));

describe('FriendsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders three tabs', async () => {
    friendService.getFriends.mockResolvedValue({ data: { content: [] } });
    render(<FriendsPage />);
    expect(screen.getByText('Friends')).toBeTruthy();
    expect(screen.getByText('Requests')).toBeTruthy();
    expect(screen.getByText('Find Readers')).toBeTruthy();
  });

  it('shows empty state when no friends', async () => {
    friendService.getFriends.mockResolvedValue({ data: { content: [] } });
    render(<FriendsPage />);
    await waitFor(() => expect(screen.getByText(/No friends yet/)).toBeTruthy());
  });
});
