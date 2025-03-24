import { AnthropicService } from './AnthropicService';
import { LoggingService } from './LoggingService';
import { LogLevel } from '../types';

// Mock the fetch function
global.fetch = jest.fn();

describe('AnthropicService', () => {
    let mockLogger: LoggingService;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create a mock logger
        mockLogger = new LoggingService(
            { loggingEnabled: true } as any,
            LogLevel.DEBUG,
            true
        );
        mockLogger.error = jest.fn();
        mockLogger.debug = jest.fn();
    });
    
    test('constructor throws error when API key is missing', () => {
        // Arrange
        const emptyApiKey = '';
        const model = 'claude-3-opus-20240229';
        
        // Act & Assert
        expect(() => {
            new AnthropicService(emptyApiKey, model, mockLogger);
        }).toThrow('Anthropic API key is required');
        
        // Verify logger was called with error
        expect(mockLogger.error).toHaveBeenCalledWith('Anthropic API key is required');
    });
    
    test('constructor throws error when model is missing', () => {
        // Arrange
        const apiKey = 'test-api-key';
        const emptyModel = '';
        
        // Act & Assert
        expect(() => {
            new AnthropicService(apiKey, emptyModel, mockLogger);
        }).toThrow('Anthropic model name is required');
        
        // Verify logger was called with error
        expect(mockLogger.error).toHaveBeenCalledWith('Anthropic model name is required');
    });
    
    test('analyze method formats prompt correctly', async () => {
        // Arrange
        const apiKey = 'test-api-key';
        const model = 'claude-3-opus-20240229';
        const service = new AnthropicService(apiKey, model, mockLogger);
        
        // Mock successful response
        const mockResponse = {
            content: [{ type: 'text', text: 'Analysis result' }]
        };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });
        
        // Act
        const result = await service.analyze(
            'Test content', 
            'Analyze this: {content} in {style} style', 
            'concise'
        );
        
        // Assert
        expect(result).toBe('Analysis result');
        expect(global.fetch).toHaveBeenCalledTimes(1);
        
        // Verify the request body contains correctly formatted prompt
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1].body);
        expect(requestBody.messages[0].content).toBe('Analyze this: Test content in concise style');
    });
});
