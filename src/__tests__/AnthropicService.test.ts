import { AnthropicService, setRequestFunction } from '../services/AnthropicService';
import { LoggingService, LogLevel } from '../services/LoggingService';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the request function
const mockRequest = jest.fn();

describe('AnthropicService', () => {
    let mockLogger: LoggingService;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Set up mock request
        setRequestFunction(mockRequest as any);
        
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
        mockRequest.mockResolvedValueOnce(JSON.stringify(mockResponse));
        
        // Act
        const result = await service.analyze(
            'Test content', 
            'Analyze this: {content} in {style} style', 
            'concise'
        );
        
        // Assert
        expect(result).toBe('Analysis result');
        expect(mockRequest).toHaveBeenCalledTimes(1);
        
        // Verify the request body contains correctly formatted prompt
        const requestCall = mockRequest.mock.calls[0][0];
        expect(requestCall.body).toBe(JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Analyze this: Test content in concise style' }],
            max_tokens: 4000
        }));
    });

    test('should handle API error responses', async () => {
        // Arrange
        const apiKey = 'test-api-key';
        const model = 'claude-3-opus-20240229';
        const service = new AnthropicService(apiKey, model, mockLogger);
        
        mockRequest.mockRejectedValueOnce(new Error('API Error'));
        
        // Act & Assert
        await expect(service.analyze(
            'Test content',
            'Test template',
            'direct'
        )).rejects.toThrow('Anthropic API error: API Error');
        
        expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle invalid JSON responses', async () => {
        // Arrange
        const apiKey = 'test-api-key';
        const model = 'claude-3-opus-20240229';
        const service = new AnthropicService(apiKey, model, mockLogger);
        
        mockRequest.mockResolvedValueOnce('invalid json');
        
        // Act & Assert
        await expect(service.analyze(
            'Test content',
            'Test template',
            'direct'
        )).rejects.toThrow('Anthropic API error: Unexpected token');
        
        expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle empty or invalid response format', async () => {
        // Arrange
        const apiKey = 'test-api-key';
        const model = 'claude-3-opus-20240229';
        const service = new AnthropicService(apiKey, model, mockLogger);
        
        mockRequest.mockResolvedValueOnce(JSON.stringify({ content: [] }));
        
        // Act & Assert
        await expect(service.analyze(
            'Test content',
            'Test template',
            'direct'
        )).rejects.toThrow('Unexpected response format from Anthropic API');
        
        expect(mockLogger.error).toHaveBeenCalled();
    });

    test('generateText method formats prompt correctly', async () => {
        // Arrange
        const apiKey = 'test-api-key';
        const model = 'claude-3-opus-20240229';
        const service = new AnthropicService(apiKey, model, mockLogger);
        
        // Mock successful response
        const mockResponse = {
            content: [{ type: 'text', text: 'Analysis result' }]
        };
        mockRequest.mockResolvedValueOnce(JSON.stringify(mockResponse));
        
        // Act
        const result = await service.generateText('Test prompt');
        
        // Assert
        expect(result).toBe('Analysis result');
        expect(mockRequest).toHaveBeenCalledTimes(1);
    });
});
