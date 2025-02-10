// src/services/AIService.ts
export interface AIService {
    analyze(content: string, template: string, style: string): Promise<string>;
}

export class OpenAIService implements AIService {
    constructor(private apiKey: string, private model: string) {}

    async analyze(content: string, template: string, style: string): Promise<string> {
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

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate analysis');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
}

export class DeepSeekService implements AIService {
    async analyze(content: string, template: string, style: string): Promise<string> {
        // DeepSeek implementation...
        throw new Error('Not implemented');
    }
}
