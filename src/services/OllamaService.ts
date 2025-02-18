import { AIService } from './AIService';
import { AIServiceError } from '../utils/error';
import { retry, RetryOptions } from '../utils/retry';
import { fetchWithError } from '../utils/fetchWithError';

export class OllamaService implements AIService {
    private readonly retryOptions: RetryOptions = {
        maxAttempts: 3,
        delayMs: 1000,
        backoffFactor: 2
    };

    constructor(private host: string, private model: string) {}

    async analyze(content: string, template: string, style: string): Promise<string> {
        return retry(async () => {
            try {
                const data = await fetchWithError<any>({
                    url: `${this.host}/api/generate`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: {
                        model: this.model,
                        prompt: `You are an insightful journaling assistant. Provide ${
                            style === 'direct' ? 'direct and honest' : 'supportive and gentle'
                        } feedback.\n\n${template}\n\nContent to analyze:\n${content}`,
                        stream: false
                    }
                });

                if (!data.response) {
                    throw new AIServiceError('No content in response', undefined, false);
                }
                return data.response;
            } catch (error) {
                if (error instanceof AIServiceError) {
                    // Customize error messages for Ollama
                    if (error.message.includes('Internal Server Error')) {
                        throw new AIServiceError('Ollama request failed: Internal Server Error', error, true);
                    }
                    throw error;
                }
                throw new AIServiceError('Failed to communicate with Ollama', error as Error, true);
            }
        }, this.retryOptions);
    }
}
