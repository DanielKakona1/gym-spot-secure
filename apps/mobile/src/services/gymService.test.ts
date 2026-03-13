import { gymService } from './gymService';

describe('gymService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('returns gyms on success', async () => {
    const gyms = [{ id: 'gym-1', name: 'Peak Club', capacityLimit: 30 }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => gyms,
    });

    const result = await gymService.listGyms();

    expect(result).toEqual(gyms);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/gyms');
  });

  it('returns capacity with encoded slotTime', async () => {
    const slotTime = '2099-03-12T18:00:00.000Z';
    const capacity = { gymId: 'gym-1', currentBookings: 8, capacityLimit: 30, fullnessPercentage: 27 };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => capacity,
    });

    const result = await gymService.getCapacity('gym-1', slotTime);

    expect(result).toEqual(capacity);
    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:3000/gyms/gym-1/capacity?slotTime=${encodeURIComponent(slotTime)}`,
    );
  });

  it('throws the API message when booking fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Slot is fully booked' }),
    });

    await expect(gymService.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T18:00:00.000Z' })).rejects.toThrow(
      'Slot is fully booked',
    );
  });
});
