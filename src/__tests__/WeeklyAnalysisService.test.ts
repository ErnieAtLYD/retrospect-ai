import { PrivacyManager } from "../services/PrivacyManager";
import { WeeklyAnalysisService } from "../services/WeeklyAnalysisService";
import { AIService } from "../services/AIService";
import { RetrospectAISettings } from "../types";
import { App } from "obsidian";

describe('WeeklyAnalysisService', () => {
    let privacyManager: PrivacyManager;
    let weeklyAnalysisService: WeeklyAnalysisService;

    beforeEach(() => {
        const mockAIService = {} as AIService;
        const mockSettings = {} as RetrospectAISettings;
        const mockApp = {} as App;
        
        privacyManager = new PrivacyManager(':::private');
        weeklyAnalysisService = new WeeklyAnalysisService(
            mockSettings,
            mockApp,
            privacyManager,
            mockAIService
        );
    });

    test('should initialize properly', () => {
        expect(weeklyAnalysisService).toBeDefined();
    });
});
