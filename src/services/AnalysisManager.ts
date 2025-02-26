// src/services/AnalysisManager.ts
import { AIService } from "./AIService";
import { PrivacyManager } from "./PrivacyManager";
import { CacheManager } from "./CacheManager";

export class AnalysisManager {
    private cacheManager: CacheManager;

    constructor(
        private aiService: AIService,
        private privacyManager: PrivacyManager,
        cacheTTLMinutes: number = 60
    ) {
        this.cacheManager = new CacheManager(cacheTTLMinutes);
    }

    async analyzeContent(
        content: string,
        template: string,
        style: string
    ): Promise<string> {
        const sanitizedContent = this.privacyManager.removePrivateSections(content);
        const cacheKey = this.cacheManager.generateKey(sanitizedContent, template, style);
        
        const cachedResult = this.cacheManager.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        const result = await this.aiService.analyze(sanitizedContent, template, style);
        this.cacheManager.set(cacheKey, result);
        return result;
    }

    clearCache(): void {
        this.cacheManager.clear();
    }
}
