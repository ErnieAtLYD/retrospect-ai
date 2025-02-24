import { PrivacyManager } from "./PrivacyManager";
import { WeeklyAnalysisService } from "./WeeklyAnalysisService";
import { AIService } from "./AIService";
import { RecapitanSettings } from "../types";
import { App } from "obsidian";

describe('WeeklyAnalysisService', () => {
    let privacyManager: PrivacyManager;
    let weeklyAnalysisService: WeeklyAnalysisService;

    beforeEach(() => {
        const mockAIService = {} as AIService;
        const mockSettings = {} as RecapitanSettings;
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
