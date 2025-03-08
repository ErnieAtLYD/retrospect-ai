// src/services/AIService.ts

/**
 * AI service interface.
 */
export interface AIService {
	analyze(content: string, template: string, style: string): Promise<string>;
}



