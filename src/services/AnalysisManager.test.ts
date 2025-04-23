import { AnalysisManager } from './AnalysisManager';
import { AIService } from './AIService';
import { PrivacyManager } from './PrivacyManager';

describe('AnalysisManager', () => {
    let analysisManager: AnalysisManager;
    let mockAIService: jest.Mocked<AIService>;
    let mockPrivacyManager: jest.Mocked<PrivacyManager>;

    beforeEach(() => {
        // Create mock implementations
        mockAIService = {
            analyze: jest.fn().mockResolvedValue('Analyzed content')
        } as any;

        mockPrivacyManager = {
            removePrivateSections: jest.fn().mockImplementation(content => content)
        } as any;

        // Create the analysis manager with mocks
        const mockPlugin = {
            settings: {},
            serviceManager: {},
            commandManager: {},
            uiManager: {},
            app: {}
        } as any;

        analysisManager = new AnalysisManager(
            mockPlugin,
            mockAIService,
            mockPrivacyManager,
            60, // cacheTTLMinutes
            100 // cacheMaxSize
        );
    });

    describe('analyzeContent', () => {
        it('should handle empty content gracefully', async () => {
            // Test with empty string
            const result1 = await analysisManager.analyzeContent('', 'template', 'style');
            expect(result1).toBe('');
            
            // Test with whitespace only
            const result2 = await analysisManager.analyzeContent('   \n\t   ', 'template', 'style');
            expect(result2).toBe('');
            
            // Verify the AI service was not called
            expect(mockAIService.analyze).not.toHaveBeenCalled();
        });

        it('should analyze non-empty content', async () => {
            const content = 'This is some valid content to analyze';
            const template = 'analysis template';
            const style = 'direct';
            
            await analysisManager.analyzeContent(content, template, style);
            
            // Verify privacy manager was called
            expect(mockPrivacyManager.removePrivateSections).toHaveBeenCalledWith(content);
            
            // Verify AI service was called with sanitized content
            expect(mockAIService.analyze).toHaveBeenCalledWith(content, template, style);
        });
    });
});
