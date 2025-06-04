import { CacheManager } from "../services/CacheManager";

describe("CacheManager", () => {
	it("should generate a unique key", () => {
		const cacheManager = new CacheManager(10);
        const key = cacheManager.generateKey(
            "test content", 
            "test template",
            "test style"
        );
        expect(key).toBe("test content:test template:test style");
	});
});
