import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleInit() {
    try {
      // Test the connection
      await this.cache.set('connection-test', 'ok', 1);
      const test = await this.cache.get('connection-test');
      if (test === 'ok') {
        this.isConnected = true;
        this.logger.log('Redis connection established successfully');
      } else {
        this.logger.error('Redis connection test failed');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error.stack);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.logger.warn('Attempting to get from Redis while disconnected');
      return null;
    }

    try {
      const value = await this.cache.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache for key: ${key}`, error.stack);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Attempting to set in Redis while disconnected');
      return;
    }

    try {
      await this.cache.set(key, value, ttl);
      this.logger.debug(`Cache set for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting cache for key: ${key}`, error.stack);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Attempting to delete from Redis while disconnected');
      return;
    }

    try {
      await this.cache.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key: ${key}`, error.stack);
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Attempting to clear Redis while disconnected');
      return;
    }

    try {
      const keys = await this.keys('*');
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.cache.del(key)));
      }
      this.logger.debug('Cache cleared');
    } catch (error) {
      this.logger.error('Error clearing cache', error.stack);
    }
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    if (!this.isConnected) {
      this.logger.warn('Attempting to wrap in Redis while disconnected');
      return await fn();
    }

    try {
      return await this.cache.wrap(key, fn, ttl);
    } catch (error) {
      this.logger.error(`Error wrapping cache for key: ${key}`, error.stack);
      // If cache fails, execute the function anyway
      return await fn();
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) {
      this.logger.warn('Attempting to get keys from Redis while disconnected');
      return [];
    }

    try {
      const keys = (await (this.cache as any).store?.keys?.(pattern)) || [];
      return keys;
    } catch (error) {
      this.logger.error(
        `Error getting keys for pattern: ${pattern}`,
        error.stack,
      );
      return [];
    }
  }
}
