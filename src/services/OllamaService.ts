import { AIService } from './AIService';
import { AIServiceError } from '../utils/error';
import { retry, RetryOptions } from '../utils/retry';

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
                const response = await fetch(`${this.host}/api/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: this.model,
                        prompt: `You are an insightful journaling assistant. Provide ${
                            style === 'direct' ? 'direct and honest' : 'supportive and gentle'
                        } feedback.\n\n${template}\n\nContent to analyze:\n${content}`,
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errorMessage = response.status === 500 
                        ? 'Ollama request failed: Internal Server Error'
                        : `Ollama request failed: ${response.statusText}`;
                    throw new AIServiceError(
                        errorMessage,
                        undefined,
                        response.status >= 500
                    );
                }

                const data = await response.json();
                if (!data.response) {
                    throw new AIServiceError('No content in response', undefined, false);
                }
                return data.response;
            } catch (error) {
                if (error instanceof AIServiceError) {
                    throw error;
                }
                throw new AIServiceError('Failed to communicate with Ollama', error as Error, true);
            }
        }, this.retryOptions);
    }
}
