// src/services/AIService.ts
import { retry, RetryOptions } from '../../utils/retry';
import { AIServiceError } from '../utils/error';
import { fetchWithError } from '../utils/fetchWithError';

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
            const data = await fetchWithError<any>({
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: {
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
                }
            });

            const result = data.choices[0]?.message?.content;
            if (!result) {
                throw new AIServiceError('No content in response', undefined, false);
            }
            return result;
        }, this.retryOptions);
    }
}

