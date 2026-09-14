import { Cache } from 'cache-manager';

export function CacheKey(prefix: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager = this.cacheManager as Cache;
      const key = `${prefix}:${args.join(':')}`;

      try {
        const cachedValue = await cacheManager.get(key);
        if (cachedValue) {
          return cachedValue;
        }

        const result = await originalMethod.apply(this, args);
        await cacheManager.set(key, result);
        return result;
      } catch (error) {
        // If cache fails, execute the original method
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

export function InvalidateCache(prefix: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager = this.cacheManager as Cache;
      const result = await originalMethod.apply(this, args);

      try {
        const pattern = `${prefix}:*`;
        // Use a type assertion to access the store property
        const store = (cacheManager as any).store;
        if (store?.keys) {
          const keys = await store.keys(pattern);
          await Promise.all(keys.map((key: string) => cacheManager.del(key)));
        }
      } catch (error) {
        // If cache invalidation fails, continue with the result
      }

      return result;
    };

    return descriptor;
  };
}
