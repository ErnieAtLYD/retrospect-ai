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
        analysisManager = new AnalysisManager(
            mockAIService,
            mockPrivacyManager,
            60, // cacheTTLMinutes
            100 // cacheMaxSize
        );
    });

    describe('analyzeContent', () => {
        it('should throw an error when content is empty', async () => {
            // Test with empty string
            await expect(
                analysisManager.analyzeContent('', 'template', 'style')
            ).rejects.toThrow('Cannot analyze empty content');

            // Test with whitespace only
            await expect(
                analysisManager.analyzeContent('   \n\t   ', 'template', 'style')
            ).rejects.toThrow('Cannot analyze empty content');
            
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
