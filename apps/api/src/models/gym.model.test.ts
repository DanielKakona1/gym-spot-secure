import { createGymModel } from './gym.model';

describe('gym.model', () => {
  it('returns default seeded gym', async () => {
    const model = createGymModel();

    const gym = await model.getGymById('gym-1');

    expect(gym?.id).toBe('gym-1');
    expect(gym?.capacityLimit).toBe(30);
  });

  it('returns null for unknown gym', async () => {
    const model = createGymModel();

    const gym = await model.getGymById('missing');

    expect(gym).toBeNull();
  });
});
