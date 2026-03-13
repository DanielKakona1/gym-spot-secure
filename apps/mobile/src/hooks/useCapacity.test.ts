const mockUseQuery = jest.fn();
const mockGetCapacity = jest.fn();
const mockUseQueryProxy = (options: any) => mockUseQuery(options);
const mockGetCapacityProxy = (...args: any[]) => mockGetCapacity(...args);

jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => mockUseQueryProxy(options),
}));

jest.mock('../services/gymService', () => ({
  gymService: {
    getCapacity: (...args: any[]) => mockGetCapacityProxy(...args),
  },
}));

import { useCapacity } from './useCapacity';

describe('useCapacity', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockGetCapacity.mockReset();
  });

  it('builds the expected query config', async () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });

    useCapacity('gym-1', '2099-03-12T18:00:00.000Z');

    expect(mockUseQuery).toHaveBeenCalledTimes(1);
    const options = mockUseQuery.mock.calls[0][0];

    expect(options.queryKey).toEqual(['capacity', 'gym-1', '2099-03-12T18:00:00.000Z']);
    expect(options.enabled).toBe(true);

    mockGetCapacity.mockResolvedValue({ gymId: 'gym-1' });
    await options.queryFn();

    expect(mockGetCapacity).toHaveBeenCalledWith('gym-1', '2099-03-12T18:00:00.000Z');
  });

  it('disables query when inputs are missing', () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });

    useCapacity('', '');

    const options = mockUseQuery.mock.calls[0][0];
    expect(options.enabled).toBe(false);
  });
});
