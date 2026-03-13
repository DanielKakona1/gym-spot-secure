export interface LockManager {
  runExclusive: <T>(key: string, task: () => Promise<T>) => Promise<T>;
}

export function createLockManager(): LockManager {
  const queueByKey = new Map<string, Promise<void>>();

  return {
    async runExclusive<T>(key: string, task: () => Promise<T>): Promise<T> {
      const previous = queueByKey.get(key) ?? Promise.resolve();

      let release: () => void = () => undefined;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });

      const chain = previous.then(() => current);
      queueByKey.set(key, chain);

      await previous;

      try {
        return await task();
      } finally {
        release();
        if (queueByKey.get(key) === chain) {
          queueByKey.delete(key);
        }
      }
    },
  };
}
