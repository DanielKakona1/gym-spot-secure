import { createLockManager } from './lock-manager.util';

describe('lock-manager.util', () => {
  it('runs tasks sequentially for the same key', async () => {
    const lockManager = createLockManager();
    const events: string[] = [];

    const first = lockManager.runExclusive('gym-1:slot-1', async () => {
      events.push('first-start');
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push('first-end');
    });

    const second = lockManager.runExclusive('gym-1:slot-1', async () => {
      events.push('second-start');
      events.push('second-end');
    });

    await Promise.all([first, second]);

    expect(events).toEqual(['first-start', 'first-end', 'second-start', 'second-end']);
  });

  it('allows parallel execution for different keys', async () => {
    const lockManager = createLockManager();
    const starts: string[] = [];

    await Promise.all([
      lockManager.runExclusive('key-1', async () => {
        starts.push('key-1');
        await new Promise((resolve) => setTimeout(resolve, 10));
      }),
      lockManager.runExclusive('key-2', async () => {
        starts.push('key-2');
      }),
    ]);

    expect(starts).toEqual(expect.arrayContaining(['key-1', 'key-2']));
  });
});
