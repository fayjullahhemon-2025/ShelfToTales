import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import AdminOrdersPage from './page';
import { adminOrderService } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  adminOrderService: {
    getAll: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}));

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders orders from API on success', async () => {
    adminOrderService.getAll.mockResolvedValue({
      data: [
        { id: 1, status: 'PENDING', orderDate: '2026-01-01T00:00:00Z', totalAmount: 25, discountAmount: 5, items: [] },
        { id: 2, status: 'SHIPPED', orderDate: '2026-01-02T00:00:00Z', totalAmount: 18, discountAmount: 0, items: [] },
      ],
    });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
    });
    // PENDING appears as both a filter button and a status badge
    expect(screen.getAllByText('PENDING').length).toBeGreaterThan(0);
    // SHIPPED appears as both a filter button, badge, and status-change button
    expect(screen.getAllByText('SHIPPED').length).toBeGreaterThan(0);
  });

  test('shows "No orders yet" when API returns empty list', async () => {
    adminOrderService.getAll.mockResolvedValue({ data: [] });

    render(<AdminOrdersPage />);
    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
    });
  });

  test('shows error toast when API rejects (e.g. 403 not admin)', async () => {
    const Swal = (await import('sweetalert2')).default;
    adminOrderService.getAll.mockRejectedValue({ response: { status: 403 } });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Failed to load orders',
        expect.stringContaining('admin access'),
        'error'
      );
    });
  });

  test('shows error toast on 401', async () => {
    const Swal = (await import('sweetalert2')).default;
    adminOrderService.getAll.mockRejectedValue({ response: { status: 401 } });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Failed to load orders',
        expect.stringContaining('Not signed in'),
        'error'
      );
    });
  });

  test('updateStatus calls API and patches local state on success', async () => {
    const Swal = (await import('sweetalert2')).default;
    adminOrderService.getAll.mockResolvedValue({
      data: [{ id: 7, status: 'PENDING', orderDate: '2026-01-01T00:00:00Z', totalAmount: 10, discountAmount: 0, items: [] }],
    });
    adminOrderService.updateStatus.mockResolvedValue({ data: { id: 7, status: 'CONFIRMED' } });

    render(<AdminOrdersPage />);
    await waitFor(() => screen.getByText('Order #7'));

    const confirmedBtns = screen.getAllByText('CONFIRMED');
    const actionBtn = confirmedBtns.find(btn => btn.closest('td'));
    expect(actionBtn).toBeTruthy();
    fireEvent.click(actionBtn);

    await waitFor(() => {
      expect(adminOrderService.updateStatus).toHaveBeenCalledWith(7, 'CONFIRMED');
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Order CONFIRMED' }));
    });
  });

  test('updateStatus shows error toast on failure', async () => {
    const Swal = (await import('sweetalert2')).default;
    adminOrderService.getAll.mockResolvedValue({
      data: [{ id: 7, status: 'PENDING', orderDate: '2026-01-01T00:00:00Z', totalAmount: 10, discountAmount: 0, items: [] }],
    });
    adminOrderService.updateStatus.mockRejectedValue({ response: { status: 500 } });

    render(<AdminOrdersPage />);
    await waitFor(() => screen.getByText('Order #7'));

    const confirmedBtns = screen.getAllByText('CONFIRMED');
    const actionBtn = confirmedBtns.find(btn => btn.closest('td'));
    expect(actionBtn).toBeTruthy();
    fireEvent.click(actionBtn);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith('Update failed', expect.stringContaining('Server error'), 'error');
    });
  });
});
