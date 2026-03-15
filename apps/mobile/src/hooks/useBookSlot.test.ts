import type { Booking, BookingRequest } from '@gym-spot/shared-types';
import { useBookSlot } from './useBookSlot';

type MutationOptions = {
  mutationFn: (request: BookingRequest) => Promise<Booking>;
  onSettled: (booking: Booking | undefined, error: unknown, request: BookingRequest) => void;
};

const mockUseMutation: jest.Mock = jest.fn();
const mockUseQueryClient = jest.fn();
const mockBookSlot = jest.fn<Promise<Booking>, [string, BookingRequest]>();

jest.mock('@tanstack/react-query', () => ({
  useMutation: (options: MutationOptions) => mockUseMutation(options),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock('../services/gymService', () => ({
  gymService: {
    bookSlot: (...args: [string, BookingRequest]) => mockBookSlot(...args),
  },
}));

describe('useBookSlot', () => {
  beforeEach(() => {
    mockUseMutation.mockReset();
    mockUseQueryClient.mockReset();
    mockBookSlot.mockReset();
  });

  it('builds mutation config and invalidates related queries on success', async () => {
    const invalidateQueries = jest.fn();
    mockUseQueryClient.mockReturnValue({ invalidateQueries });
    mockUseMutation.mockImplementation((options) => options);

    const mutation = useBookSlot('gym-1') as unknown as MutationOptions;

    await mutation.mutationFn({ userId: 'user-1', slotTime: '2099-03-12T18:00:00.000Z' });

    expect(mockBookSlot).toHaveBeenCalledWith('gym-1', {
      userId: 'user-1',
      slotTime: '2099-03-12T18:00:00.000Z',
    });

    mutation.onSettled(
      {
      id: 'booking-1',
      gymId: 'gym-1',
      userId: 'user-1',
      slotTime: '2099-03-12T18:00:00.000Z',
      status: 'BOOKED',
      createdAt: '2099-03-12T12:00:00.000Z',
      },
      null,
      { userId: 'user-1', slotTime: '2099-03-12T18:00:00.000Z' },
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['capacity', 'gym-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['capacity-by-time', 'gym-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user-bookings', 'user-1'],
    });
  });

  it('invalidates related queries on error so capacity refreshes immediately', () => {
    const invalidateQueries = jest.fn();
    mockUseQueryClient.mockReturnValue({ invalidateQueries });
    mockUseMutation.mockImplementation((options) => options);

    const mutation = useBookSlot('gym-1') as unknown as MutationOptions;

    mutation.onSettled(undefined, new Error('Slot is fully booked'), {
      userId: 'user-1',
      slotTime: '2099-03-12T18:00:00.000Z',
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['capacity', 'gym-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['capacity-by-time', 'gym-1'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user-bookings', 'user-1'],
    });
  });
});
