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
export function isAIService(service: unknown): service is AIService {
	return service !== undefined && 
	       typeof service === 'object' && 
	       service !== null &&
	       'analyze' in service && 
	       typeof (service as AIService).analyze === 'function';
}


