// src/services/AIService.ts
import { retry, RetryOptions } from '../../utils/retry';
import { AIServiceError } from '../utils/error';

export interface AIService {
    analyze(content: string, template: string, style: string): Promise<string>;
}

export class OpenAIService implements AIService {
    private readonly retryOptions: RetryOptions = {
        maxAttempts: 3,
        delayMs: 1000,
        backoffFactor: 2
    };

    constructor(private apiKey: string, private model: string) {}

    async analyze(content: string, template: string, style: string): Promise<string> {
        return retry(async () => {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [
                            {
                                role: 'system',
                                content: `You are an insightful journaling assistant. Provide ${
                                    style === 'direct' ? 'direct and honest' : 'supportive and gentle'
                                } feedback. ${template}`
                            },
                            { role: 'user', content }
                        ]
                    })
                });

                if (response.status === 401) {
                    throw new AIServiceError('Unauthorized: Please check your API key.', undefined, false);
                } else if (response.status === 429) {
                    throw new AIServiceError('Rate limit exceeded', undefined, true);
                } else if (!response.ok) {
                    const error = await response.json();
                    throw new AIServiceError(
                        error.error?.message || 'Failed to generate analysis',
                        undefined,
                        response.status >= 500
                    );
                }

                const data = await response.json();
                const result = data.choices[0]?.message?.content;
                if (!result) {
                    throw new AIServiceError('No content in response', undefined, false);
                }
                return result;
            } catch (error) {
                if (error instanceof AIServiceError) {
                    throw error;
                }
                throw new AIServiceError('Failed to communicate with OpenAI', error as Error);
            }
        }, this.retryOptions);
    }
}

