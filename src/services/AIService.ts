// src/services/AIService.ts

/**
 * AI service interface.
 */
export interface AIService {
	analyze(
		content: string, 
		template: string, 
		style: string
	): Promise<string>;
}

// Type guard to check if AIService is properly implemented
export function isAIService(service: AIService | undefined): service is AIService {
	return service !== undefined && typeof service.analyze === 'function';
}



