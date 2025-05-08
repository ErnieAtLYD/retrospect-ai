import { AnalysisManager } from '../services/AnalysisManager';
import { AIService } from '../services/AIService';
import { PrivacyManager } from '../services/PrivacyManager';
import { ReflectionMemoryManager } from '../services/ReflectionMemoryManager';

describe('AnalysisManager', () => {
    let analysisManager: AnalysisManager;
    let mockAIService: jest.Mocked<AIService>;
    let mockPrivacyManager: jest.Mocked<PrivacyManager>;
    let mockReflectionMemoryManager: jest.Mocked<ReflectionMemoryManager>;

    beforeEach(() => {
        // Create mock implementations
        mockAIService = {
            analyze: jest.fn().mockResolvedValue('Analyzed content')
        } as any;

        mockPrivacyManager = {
            removePrivateSections: jest.fn().mockImplementation(content => content)
        } as any;
        
        mockReflectionMemoryManager = {
            addReflection: jest.fn().mockResolvedValue({ id: '123', timestamp: Date.now() }),
            initialize: jest.fn().mockResolvedValue(undefined)
        } as any;

        // Create the analysis manager with mocks
        const mockPlugin = {
            settings: {},
            serviceManager: {},
            commandManager: {},
            uiManager: {
                activateView: jest.fn()
            },
            app: {
                workspace: {
                    getLeavesOfType: jest.fn().mockReturnValue([])
                }
            }
        } as any;

        analysisManager = new AnalysisManager(
            mockPlugin,
            mockAIService,
            mockPrivacyManager,
            mockReflectionMemoryManager,
            60, // cacheTTLMinutes
            100 // cacheMaxSize
        );
    });

    describe('analyzeContent', () => {
        it('should validate content is not empty', async () => {
            // Since we've improved validation, empty content should now throw an error
            await expect(analysisManager.analyzeContent('', 'template', 'direct'))
                .rejects.toThrow('Content cannot be empty');
                
            // Test with whitespace only
            await expect(analysisManager.analyzeContent('   \n\t   ', 'template', 'direct'))
                .rejects.toThrow('Content cannot be empty');
            
            // Verify AI service was not called
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
