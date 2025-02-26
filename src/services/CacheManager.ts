interface CacheEntry {
	value: string;
	timestamp: number;
}

export class CacheManager {
	private cache: Map<string, CacheEntry> = new Map();
	private ttlMillis: number;

	constructor(ttlMinutes: number) {
		this.ttlMillis = ttlMinutes * 60 * 1000;
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
	get(key: string): string | null {
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
	set(key: string, value: string): void {
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
}
