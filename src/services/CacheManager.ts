interface CacheEntry<T> {
	value: T;
	timestamp: number;
}

/**
 * A cache manager for storing and retrieving cached values
 * @template T - The type of the cached value
 */
export class CacheManager<T = string> {
	private cache: Map<string, CacheEntry<T>> = new Map();
	private ttlMillis: number;
	private maxSize: number;

	constructor(ttlMinutes: number, maxSize = 100) {
		this.ttlMillis = ttlMinutes * 60 * 1000;
		this.maxSize = maxSize;
	}

	/**
	 * Generate a unique key for the cache based on the content, template, and style
	 * @param content - The content to be cached
	 * @param template - The template to be used for the cache key
	 * @param style - The style to be used for the cache key
	 * @returns A unique key for the cache
	 */
	generateKey(content: string, template: string, style: string): string {
		return `${content}:${template}:${style}`;
	}

	/**
	 * Get the cached value for the given key
	 * @param key - The key to get the cached value for
	 * @returns The cached value or null if it doesn't exist or has expired
	 */
	get(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		const now = Date.now();
		if (now - entry.timestamp > this.ttlMillis) {
			this.cache.delete(key);
			return null;
		}

		return entry.value;
	}

	/**
	 * Set the cached value for the given key
	 * @param key - The key to set the cached value for
	 * @param value - The value to set in the cache
	 */
	private evictLRU(): void {
		if (this.cache.size <= this.maxSize) return;

		let oldestKey: string | null = null;
		let oldestTime = Infinity;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.timestamp < oldestTime) {
				oldestTime = entry.timestamp;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey);
		}
	}

	/**
	 * Set the cached value for the given key
	 * @param key - The key to set the cached value for
	 * @param value - The value to set in the cache
	 */
	set(key: string, value: T): void {
		if (this.cache.size >= this.maxSize) {
			this.evictLRU();
		}

		this.cache.set(key, {
			value,
			timestamp: Date.now(),
		});
	}

	/**
	 * Clear the cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get the size of the cache
	 * @returns The size of the cache
	 */
	getSize(): number {
		return this.cache.size;
	}

	/**
	 * Get the TTL of the cache
	 * @returns The TTL of the cache
	 */
	getTTL(): number {
		return this.ttlMillis;
	}
}
