import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FriendButton from './FriendButton';
import { friendService } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  friendService: { getStatus: vi.fn(), sendRequest: vi.fn(), acceptRequest: vi.fn(), rejectRequest: vi.fn(), unfriend: vi.fn() },
}));

describe('FriendButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows Add Friend when status is NONE', async () => {
    friendService.getStatus.mockResolvedValue({ data: { status: 'NONE' } });
    render(<FriendButton userId={1} />);
    await waitFor(() => expect(screen.getByText('+ Add Friend')).toBeTruthy());
  });

  it('shows Request Sent when status is REQUEST_SENT', async () => {
    friendService.getStatus.mockResolvedValue({ data: { status: 'REQUEST_SENT' } });
    render(<FriendButton userId={1} />);
    await waitFor(() => expect(screen.getByText('Request Sent')).toBeTruthy());
  });

  it('shows Accept/Decline when status is REQUEST_RECEIVED', async () => {
    friendService.getStatus.mockResolvedValue({ data: { status: 'REQUEST_RECEIVED' } });
    render(<FriendButton userId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeTruthy();
      expect(screen.getByText('Decline')).toBeTruthy();
    });
  });

  it('shows Friends when status is FRIENDS', async () => {
    friendService.getStatus.mockResolvedValue({ data: { status: 'FRIENDS' } });
    render(<FriendButton userId={1} />);
    await waitFor(() => expect(screen.getByText('Friends ✓')).toBeTruthy());
  });
});
