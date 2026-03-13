import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BookingScreen } from './BookingScreen';

const mockUseQuery = jest.fn();
const mockUseQueries = jest.fn();
const mockUseQueryClient = jest.fn();
const mockUseCapacity = jest.fn();
const mockUseBookSlot = jest.fn();

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => mockUseQuery(options),
  useQueries: (options: any) => mockUseQueries(options),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock('../hooks/useCapacity', () => ({
  useCapacity: (...args: any[]) => mockUseCapacity(...args),
}));

jest.mock('../hooks/useBookSlot', () => ({
  useBookSlot: (...args: any[]) => mockUseBookSlot(...args),
}));

function defaultUseQueryImplementation(options: any) {
  const rootKey = options.queryKey[0];

  if (rootKey === 'gyms') {
    return {
      data: [{ id: 'gym-1', name: 'Peak Club', capacityLimit: 30 }],
      isLoading: false,
    };
  }

  if (rootKey === 'users') {
    return {
      data: [{ id: 'user-1', name: 'Ava' }],
      isLoading: false,
    };
  }

  if (rootKey === 'user-bookings') {
    return {
      data: [],
      isLoading: false,
    };
  }

  return { data: null, isLoading: false };
}

function defaultBookMutation() {
  return {
    mutate: jest.fn(),
    reset: jest.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: new Error(''),
  };
}

describe('BookingScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2099-03-12T00:00:00.000Z'));

    mockUseQuery.mockImplementation(defaultUseQueryImplementation);
    mockUseQueries.mockReturnValue(Array.from({ length: 8 }, () => ({ data: { currentBookings: 0, capacityLimit: 30 } })));
    mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
    mockUseCapacity.mockReturnValue({
      data: { gymId: 'gym-1', currentBookings: 8, capacityLimit: 30, fullnessPercentage: 27 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseBookSlot.mockReturnValue(defaultBookMutation());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders capacity progress with booking ratio', () => {
    const { getByText, getByTestId } = render(<BookingScreen onGoToAdmin={jest.fn()} />);

    expect(getByText('Live Capacity')).toBeTruthy();
    expect(getByText('8/30 (27%)')).toBeTruthy();
    expect(getByTestId('capacity-progress-fill')).toHaveStyle({ width: '27%' });
  });

  it('shows capacity loading indicator state', () => {
    mockUseCapacity.mockReturnValue({ data: null, isLoading: true, isError: false, error: null });

    const { getByTestId } = render(<BookingScreen onGoToAdmin={jest.fn()} />);

    expect(getByTestId('capacity-loading')).toBeTruthy();
  });

  it('shows booking success and error messages', async () => {
    mockUseBookSlot.mockReturnValue({
      ...defaultBookMutation(),
      isSuccess: true,
      isError: true,
      error: new Error('Slot is fully booked'),
    });

    const { getByTestId } = render(<BookingScreen onGoToAdmin={jest.fn()} />);

    await waitFor(() => {
      expect(getByTestId('booking-success')).toBeTruthy();
    });

    expect(getByTestId('booking-error').props.children).toBe('Slot is fully booked');
  });

  it('books a slot after selecting gym and user', async () => {
    const mutate = jest.fn();
    mockUseBookSlot.mockReturnValue({
      ...defaultBookMutation(),
      mutate,
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<BookingScreen onGoToAdmin={jest.fn()} />);

    fireEvent.changeText(getByPlaceholderText('Search gym'), 'Peak');
    fireEvent.press(getByText('Peak Club'));

    fireEvent.changeText(getByPlaceholderText('Search user'), 'Ava');
    fireEvent.press(getByText('Ava'));

    await waitFor(() => {
      expect(queryByText('Select gym and user first to enable date and time.')).toBeNull();
    });

    fireEvent.press(getByText('06:00'));
    fireEvent.press(getByText('Book Slot'));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          slotTime: expect.any(String),
        }),
      );
    });
  });
});
