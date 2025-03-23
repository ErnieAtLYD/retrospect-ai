// src/services/AnalysisManager.ts
import { AIService } from "./AIService";
import { PrivacyManager } from "./PrivacyManager";
import { CacheManager } from "./CacheManager";

export class AnalysisManager {
    private cacheManager: CacheManager;

    constructor(
        private aiService: AIService,
        private privacyManager: PrivacyManager,
        cacheTTLMinutes = 60,
        cacheMaxSize = 100
    ) {
        if (!aiService) {
            throw new Error("AI Service must be provided to AnalysisManager");
        }
        this.cacheManager = new CacheManager(cacheTTLMinutes, cacheMaxSize);
    }

    async analyzeContent(
        content: string,
        template: string,
        style: string
    ): Promise<string> {
        // Validate inputs
        if (!content || content.trim() === "") {
            throw new Error("Cannot analyze empty content. Please add at least 20 characters of text to gather meaningful insights.");
        }
        
        if (!template) {
            throw new Error("Analysis template is required");
        }
        
        if (!style || !["direct", "gentle"].includes(style)) {
            throw new Error("Invalid communication style. Must be 'direct' or 'gentle'");
        }
        
        const sanitizedContent = this.privacyManager.removePrivateSections(content);
        const cacheKey = this.cacheManager.generateKey(sanitizedContent, template, style);
        
        const cachedResult = this.cacheManager.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        // We know this.aiService is definitely AIService because of the constructor check
        const result = await this.aiService.analyze(sanitizedContent, template, style);
        this.cacheManager.set(cacheKey, result);
        return result;
    }

    clearCache(): void {
        this.cacheManager.clear();
    }
}
