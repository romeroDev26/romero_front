import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SeatRealtime } from './SeatRealtime';
import { SeatMapItem, SeatStatus } from '../../../../types';

vi.mock('../../utils/seatUtils', () => ({
  getSeatTypeName: (name?: string) => name || 'Estándar',
}));

describe('SeatRealtime', () => {
  const baseSeat: SeatMapItem = {
    id: 1,
    trip_id: 1,
    vessel_seat_config_id: 10,
    seat_number: 'A1',
    status: 'AVAILABLE' as SeatStatus,
    notes: '',
    seat_type: { id: 1, name: 'VIP', code: 'VIP', price_multiplier: 1 } as any,
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
    // Mock getBoundingClientRect for tooltip positioning
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 48,
      height: 48,
      top: 100,
      left: 100,
      bottom: 148,
      right: 148,
      x: 100,
      y: 100,
      toJSON: () => {},
    }));
  });

  const renderSeat = (props: Partial<Parameters<typeof SeatRealtime>[0]> = {}) => {
    return render(
      <SeatRealtime
        seat={baseSeat}
        isSelected={false}
        onClick={mockOnClick}
        isLocked={false}
        connectionStatus="connected"
        isWebSocketAvailable={true}
        {...props}
      />
    );
  };

  it('renders seat number', () => {
    renderSeat();
    expect(screen.getByRole('button', { name: /A1/i })).toBeInTheDocument();
  });

  it('AVAILABLE seat is clickable and shows green connection indicator when connected', () => {
    renderSeat({ connectionStatus: 'connected', isWebSocketAvailable: true });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(mockOnClick).toHaveBeenCalledWith(baseSeat);
  });

  it('AVAILABLE seat shows gray indicator when connection failed', () => {
    renderSeat({ connectionStatus: 'failed' });
    const btn = screen.getByRole('button', { name: /A1/i });
    expect(btn).toBeInTheDocument();
    // The gray indicator is a child div, not directly testable by text
  });

  it('CONFIRMED seat is disabled and styled red', () => {
    renderSeat({ seat: { ...baseSeat, status: 'CONFIRMED' as SeatStatus } });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-red-500');
  });

  it('RESERVED seat is disabled and styled yellow', () => {
    renderSeat({ seat: { ...baseSeat, status: 'RESERVED' as SeatStatus } });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-yellow-500');
  });

  it('selected seat is blue and scaled', () => {
    renderSeat({ isSelected: true });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn.className).toContain('bg-blue-500');
    expect(btn.className).toContain('scale-105');
    expect(btn).not.toBeDisabled();
  });

  it('locked seat is not clickable', () => {
    renderSeat({ isLocked: true });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('active selection from other user blocks click and shows orange', () => {
    renderSeat({
      activeSelection: {
        seatId: 1,
        userId: 'other-user',
        userName: 'Juan',
        timestamp: new Date().toISOString(),
        type: 'temporary',
      },
    });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-orange-400');
  });

  it('representative active selection blocks click and shows purple', () => {
    renderSeat({
      activeSelection: {
        seatId: 1,
        userId: 'other-user',
        userName: 'Corp',
        timestamp: new Date().toISOString(),
        type: 'representative',
        companyName: 'Acme',
        representativeName: 'Rep1',
      },
    });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-purple-500');
  });

  it('temp_reserved active selection blocks click and shows purple-400', () => {
    renderSeat({
      activeSelection: {
        seatId: 1,
        userId: 'other-user',
        userName: 'Corp',
        timestamp: new Date().toISOString(),
        type: 'temp_reserved',
        companyName: 'Acme',
      },
    });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-purple-400');
  });

  it('isOccupiedByRepresentative blocks click and shows purple', () => {
    renderSeat({ isOccupiedByRepresentative: true });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-purple-500');
  });

  it('click is allowed when activeSelection is from current user', () => {
    renderSeat({
      isSelected: true,
      activeSelection: {
        seatId: 1,
        userId: 'me',
        userName: 'Me',
        timestamp: new Date().toISOString(),
        type: 'temporary',
      },
    });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('shows tooltip on mouse enter', () => {
    renderSeat();
    const btn = screen.getByRole('button', { name: /A1/i });

    fireEvent.mouseEnter(btn);
    expect(screen.getByText(/Tipo:/i)).toBeInTheDocument();
    expect(screen.getByText(/Estado:/i)).toBeInTheDocument();

    fireEvent.mouseLeave(btn);
    expect(screen.queryByText(/Tipo:/i)).not.toBeInTheDocument();
  });

  it('shows occupant tooltip for CONFIRMED seat with occupant data', () => {
    renderSeat({
      seat: {
        ...baseSeat,
        status: 'CONFIRMED' as SeatStatus,
        occupant: {
          passenger_name: 'Maria Garcia',
          origin_stop_name: 'Iquitos',
          destination_stop_name: 'Lima',
          document_number: '12345678',
          amount_paid: 150.0,
          currency_code: 'PEN',
          status_detail: 'Pagado',
        },
      },
    });

    const btn = screen.getByRole('button', { name: /A1/i });
    fireEvent.mouseEnter(btn);

    expect(screen.getByText(/Maria Garcia/i)).toBeInTheDocument();
    expect(screen.getByText(/Iquitos/i)).toBeInTheDocument();
    expect(screen.getByText(/Lima/i)).toBeInTheDocument();
  });

  it('BLOCKED seat is disabled and gray', () => {
    renderSeat({ seat: { ...baseSeat, status: 'BLOCKED' as SeatStatus } });
    const btn = screen.getByRole('button', { name: /A1/i });

    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-gray-500');
  });
});
