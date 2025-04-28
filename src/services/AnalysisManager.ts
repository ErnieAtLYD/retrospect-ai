// src/services/AnalysisManager.ts

import { Notice } from "obsidian";
import { AIService } from "./AIService";
import { PrivacyManager } from "./PrivacyManager";
import { CacheManager } from "./CacheManager";
import RetrospectAI from "../main";

export type AnalysisStyle = "direct" | "gentle";

export interface AnalysisResult {
	content: string;
	timestamp: number;
	noteId?: string;
	noteName?: string;
}

export interface AnalysisRequest {
	content: string;
	template: string;
	style: AnalysisStyle;
}

export class AnalysisError extends Error {
	constructor(message: string, public readonly code: string) {
		super(message);
		this.name = "AnalysisError";
	}
}

export class AnalysisManager {
	private readonly cacheManager: CacheManager<AnalysisResult>;
	private readonly plugin: RetrospectAI;
	private readonly aiService: AIService;
	private readonly privacyManager: PrivacyManager;

	constructor(
		plugin: RetrospectAI,
		aiService: AIService,
		privacyManager: PrivacyManager,
		cacheTTLMinutes = 60,
		cacheMaxSize = 100
	) {
		if (!aiService) {
			throw new AnalysisError(
				"AI Service must be provided to AnalysisManager",
				"MISSING_AI_SERVICE"
			);
		}
		if (!privacyManager) {
			throw new AnalysisError(
				"Privacy Manager must be provided to AnalysisManager",
				"MISSING_PRIVACY_MANAGER"
			);
		}

		this.plugin = plugin;
		this.aiService = aiService;
		this.privacyManager = privacyManager;
		this.cacheManager = new CacheManager<AnalysisResult>(
			cacheTTLMinutes,
			cacheMaxSize
		);
	}

	private handleError(error: unknown, fallbackMessage: string): void {
		if (error instanceof AnalysisError) {
			new Notice(error.message);
		} else {
			new Notice(fallbackMessage);
			console.error(fallbackMessage, error);
		}
	}

	private validateRequest(request: AnalysisRequest): void {
		if (!request.content?.trim()) {
			throw new AnalysisError("Content cannot be empty", "EMPTY_CONTENT");
		}
		if (request.content.trim().length < 20) {
			throw new AnalysisError(
				"Content must be at least 20 characters",
				"INSUFFICIENT_CONTENT"
			);
		}
		if (!request.template?.trim()) {
			throw new AnalysisError(
				"Analysis template is required",
				"MISSING_TEMPLATE"
			);
		}
		if (!request.style || !["direct", "gentle"].includes(request.style)) {
			throw new AnalysisError(
				"Invalid communication style",
				"INVALID_STYLE"
			);
		}
	}

	async analyzeContent(
		content: string,
		template: string,
		style: AnalysisStyle,
		noteId?: string,
		noteName?: string
	): Promise<void> {
		try {
			const request: AnalysisRequest = { content, template, style };
			this.validateRequest(request);

			const sanitizedContent =
				this.privacyManager.removePrivateSections(content);
			const cacheKey = this.cacheManager.generateKey(
				sanitizedContent,
				template,
				style
			);

			const cachedResult = this.cacheManager.get(cacheKey);
			if (cachedResult) {
				await this.updateSidePanel(
					cachedResult.content,
					noteId,
					noteName
				);
				return;
			}

			const result = await this.aiService.analyze(
				sanitizedContent,
				template,
				style
			);
			const analysisResult: AnalysisResult = {
				content: result,
				timestamp: Date.now(),
				noteId,
				noteName,
			};

			this.cacheManager.set(cacheKey, analysisResult);
			await this.updateSidePanel(result, noteId, noteName);
		} catch (error) {
			this.handleError(error, "An unexpected error occurred during analysis");
		}
	}

	private async updateSidePanel(
		content: string,
		noteId?: string,
		noteName?: string
	): Promise<void> {
		try {
			await this.plugin.uiManager.activateView();

			const leaves =
				this.plugin.app.workspace.getLeavesOfType("commentary-view");
			if (leaves.length === 0) {
				throw new AnalysisError(
					"No commentary view found",
					"MISSING_VIEW"
				);
			}

			const { view } = leaves[0];
			if (!view || !("updateContent" in view)) {
				throw new AnalysisError(
					"Invalid commentary view",
					"INVALID_VIEW"
				);
			}

			// @ts-ignore - We know the view has this method
			view.updateContent(content, noteId, noteName);
		} catch (error) {
			this.handleError(error, "Failed to update side panel");
		}
	}

	clearCache(): void {
		this.cacheManager.clear();
	}

	getCacheStats(): { size: number; ttl: number } {
		return {
			size: this.cacheManager.getSize(),
			ttl: this.cacheManager.getTTL(),
		};
	}
}
