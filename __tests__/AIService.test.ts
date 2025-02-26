import { AIService } from '../src/services/AIService';
import { OpenAIService } from '../src/services/OpenAIService';
import { OllamaService } from '../src/services/OllamaService';
import { AIServiceError } from '../src/utils/error';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AIService', () => {
    let openAIService: AIService;
    let ollamaService: AIService;

    beforeEach(() => {
        openAIService = new OpenAIService('test-key', 'gpt-3.5-turbo');
        ollamaService = new OllamaService('http://localhost:11434', 'llama2');
        mockFetch.mockClear();
    });

    describe('OpenAIService', () => {
        it('should successfully analyze content', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: 'Analysis result' } }]
                })
            });

            const result = await openAIService.analyze(
                'test content',
                'test template',
                'direct'
            );

            expect(result).toBe('Analysis result');
        });

        it('should retry on temporary failures', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        choices: [{ message: { content: 'Analysis result' } }]
                    })
                });

            const result = await openAIService.analyze(
                'test content',
                'test template',
                'direct'
            );

            expect(result).toBe('Analysis result');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should throw AIServiceError after max retries', async () => {
            mockFetch.mockRejectedValue(new Error('Persistent error'));

            await expect(
                openAIService.analyze('test content', 'test template', 'direct')
            ).rejects.toThrow(AIServiceError);
        });
    });

    describe('OllamaService', () => {
        it('should successfully analyze content', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ response: 'Analysis result' })
            });

            const result = await ollamaService.analyze(
                'test content',
                'test template',
                'direct'
            );

            expect(result).toBe('Analysis result');
        });

        it('should retry on temporary failures', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ response: 'Analysis result' })
                });

            const result = await ollamaService.analyze(
                'test content',
                'test template',
                'direct'
            );

            expect(result).toBe('Analysis result');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should throw AIServiceError after max retries', async () => {
            mockFetch.mockRejectedValue(new Error('Persistent error'));

            await expect(
                ollamaService.analyze('test content', 'test template', 'direct')
            ).rejects.toThrow(AIServiceError);
        });
    });
});
