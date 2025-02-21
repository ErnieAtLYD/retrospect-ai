// src/services/AnalysisManager.ts
import { AIService } from "./AIService";
import { PrivacyManager } from "./PrivacyManager";

export class AnalysisManager {
	constructor(
		private aiService: AIService,
		private privacyManager: PrivacyManager
	) {}

	async analyzeContent(
		content: string,
		template: string,
		style: string
	): Promise<string> {
		const sanitizedContent =
			this.privacyManager.removePrivateSections(content);
		return await this.aiService.analyze(sanitizedContent, template, style);
	}
}
