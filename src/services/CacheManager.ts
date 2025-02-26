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

    generateKey(content: string, template: string, style: string): string {
        return `${content}:${template}:${style}`;
    }

    get(key: string): string | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > this.ttlMillis) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    set(key: string, value: string): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    clear(): void {
        this.cache.clear();
    }
}
