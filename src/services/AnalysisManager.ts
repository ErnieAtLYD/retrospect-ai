// src/services/AnalysisManager.ts

import { Notice } from "obsidian";
import { AIService } from "./AIService";
import { PrivacyManager } from "./PrivacyManager";
import { CacheManager } from "./CacheManager";
import RetrospectAI from "../main";
import { ReflectionMemoryManager } from "./ReflectionMemoryManager";
import { CommentaryView } from "../views/CommentaryView";
import { LoggingService } from "./LoggingService";

export type AnalysisStyle = "direct" | "gentle";

export interface AnalysisResult {
	content: string;
	timestamp: number;
	noteId?: string;
	noteName?: string;
}

// Alias for NoteAnalysis to maintain compatibility with CommentaryView
export type NoteAnalysis = AnalysisResult;

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

/**
 * Manages content analysis using AI services with caching and reflection storage.
 * Provides a clean interface for analyzing note content with various AI providers,
 * while handling privacy concerns, caching results, and storing reflections.
 */
export class AnalysisManager {
	private readonly cacheManager: CacheManager<AnalysisResult>;
	private readonly plugin: RetrospectAI;
	private readonly aiService: AIService;
	private readonly privacyManager: PrivacyManager;
	private readonly reflectionMemoryManager: ReflectionMemoryManager | null;
	private analysisHistory: AnalysisResult[] = [];
	private readonly logger?: LoggingService;

	constructor(
		plugin: RetrospectAI,
		aiService: AIService,
		privacyManager: PrivacyManager,
		reflectionMemoryManager: ReflectionMemoryManager | null = null,
		cacheTTLMinutes = 60,
		cacheMaxSize = 100,
		logger?: LoggingService
	) {
		if (!plugin) {
			throw new AnalysisError("Plugin instance is required", "MISSING_PLUGIN");
		}
		if (!aiService) {
			throw new AnalysisError("AI Service is required", "MISSING_AI_SERVICE");
		}
		if (!privacyManager) {
			throw new AnalysisError("Privacy Manager is required", "MISSING_PRIVACY_MANAGER");
		}
		if (cacheTTLMinutes <= 0) {
			throw new AnalysisError("Cache TTL must be positive", "INVALID_CACHE_TTL");
		}
		if (cacheMaxSize <= 0) {
			throw new AnalysisError("Cache max size must be positive", "INVALID_CACHE_SIZE");
		}

		this.logger = logger;
		this.plugin = plugin;
		this.aiService = aiService;
		this.privacyManager = privacyManager;
		this.reflectionMemoryManager = reflectionMemoryManager;
		this.cacheManager = new CacheManager<AnalysisResult>(cacheTTLMinutes, cacheMaxSize);

		this.logger?.debug("AnalysisManager initialized successfully");
	}

	/**
	 * Handle an error by displaying a notice and logging the error
	 * @param error The error to handle
	 * @param fallbackMessage The fallback message to display if the error is not an AnalysisError
	 */
	private handleError(error: unknown, fallbackMessage: string): void {
		if (error instanceof AnalysisError) {
			new Notice(error.message);
		} else {
			new Notice(fallbackMessage);
			this.logger?.error(fallbackMessage, error);
		}
	}

	/**
	 * Validate the analysis request
	 * @param request The analysis request to validate
	 * @throws AnalysisError If the request is invalid
	 */
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

	/**
	 * Analyzes note content using AI services with caching and reflection storage.
	 * 
	 * @param content The content of the note to analyze
	 * @param template The template to use for the analysis
	 * @param style The communication style for the analysis
	 * @param noteId Optional ID of the note
	 * @param noteName Optional name of the note
	 * @returns Promise resolving to the analysis result
	 */
	async analyzeContent(
		content: string,
		template: string,
		style: AnalysisStyle,
		noteId?: string,
		noteName?: string
	): Promise<AnalysisResult> {
		try {

			const request: AnalysisRequest = { content, template, style };
			this.validateRequest(request);

			const sanitizedContent = this.privacyManager.removePrivateSections(content);
			const cacheKey = this.cacheManager.generateKey(sanitizedContent, template, style);

			// Check cache first
			const cachedResult = await this.getCachedResult(cacheKey, noteId, noteName);
			if (cachedResult) {
				return cachedResult;
			}

			// Perform analysis
			const analysisResult = await this.performAnalysis(
				sanitizedContent,
				template,
				style,
				noteId,
				noteName
			);

			// Post-processing
			await this.postProcessAnalysis(analysisResult, cacheKey, content);

			return analysisResult;
		} catch (error) {
			this.handleError(error, "An unexpected error occurred during analysis");
			throw error;
		}
	}

	/**
	 * Check if a cached result exists and return it if found
	 */
	private async getCachedResult(
		cacheKey: string,
		noteId?: string,
		noteName?: string
	): Promise<AnalysisResult | null> {
		if (!this.plugin.settings.cacheEnabled) {
			return null;
		}

		const cachedResult = this.cacheManager.get(cacheKey);
		if (cachedResult) {
			this.addToHistory(cachedResult);
			await this.updateSidePanel(cachedResult.content, noteId, noteName);
			return cachedResult;
		}

		return null;
	}

	/**
	 * Perform the actual AI analysis
	 */
	private async performAnalysis(
		sanitizedContent: string,
		template: string,
		style: AnalysisStyle,
		noteId?: string,
		noteName?: string
	): Promise<AnalysisResult> {
		if (!template) {
			throw new AnalysisError("Template cannot be empty", "EMPTY_TEMPLATE");
		}

		this.logger?.debug(`Using analysis template: ${template}`);

		const interpolatedTemplate = template.replace(/{{content}}/g, sanitizedContent);
		this.logger?.debug(`Interpolated template: ${interpolatedTemplate}`);

		const result = await this.aiService.analyze(sanitizedContent, interpolatedTemplate, style);
		this.logger?.debug(`Analysis result: ${result}`);

		return {
			content: result,
			timestamp: Date.now(),
			noteId,
			noteName,
		};
	}

	/**
	 * Handle post-analysis processing including caching, history, and reflection storage
	 */
	private async postProcessAnalysis(
		analysisResult: AnalysisResult,
		cacheKey: string,
		originalContent: string
	): Promise<void> {
		// Cache result if enabled
		if (this.plugin.settings.cacheEnabled) {
			this.cacheManager.set(cacheKey, analysisResult);
		}

		// Add to analysis history
		this.addToHistory(analysisResult);

		// Store in ReflectionMemoryManager if available
		await this.storeReflection(analysisResult, originalContent);

		// Update side panel
		await this.updateSidePanel(
			analysisResult.content,
			analysisResult.noteId,
			analysisResult.noteName
		);
	}

	/**
	 * Store reflection in memory manager if available
	 */
	private async storeReflection(
		analysisResult: AnalysisResult,
		originalContent: string
	): Promise<void> {
		if (!this.reflectionMemoryManager || !analysisResult.noteId) {
			return;
		}

		try {
			const tags = this.extractTags(originalContent);
			const keywords = this.extractKeywords(analysisResult.content);
			const formattedDate = new Date().toISOString().split("T")[0];

			await this.reflectionMemoryManager.addReflection({
				date: formattedDate,
				sourceNotePath: analysisResult.noteId,
				reflectionText: analysisResult.content,
				tags,
				keywords,
			});
		} catch (error) {
			this.logger?.error("Failed to store reflection in memory manager:", error);
		}
	}

	/**
	 * Extract tags from note content
	 * @param noteContent The content to extract tags from
	 * @returns Array of extracted tags
	 */
	private extractTags(noteContent: string): string[] {
		// Extract #tags from the note content
		const tagRegex = /#([a-zA-Z0-9_-]+)/g;
		const tags: string[] = [];
		let match;

		while ((match = tagRegex.exec(noteContent)) !== null) {
			if (match[1]) {
				tags.push(match[1]);
			}
		}

		// Return unique tags
		return [...new Set(tags)];
	}

	/**
	 * Extract keywords from reflection text
	 * @param reflectionText The text to extract keywords from
	 * @returns Array of extracted keywords
	 */
	private extractKeywords(reflectionText: string): string[] {
		// Simple implementation - extract important words as keywords
		// In a real implementation, you might use NLP or other techniques
		const words = reflectionText.split(/\s+/);
		const keywords = words
			.filter((word) => word.length > 3)
			.map((word) => word.replace(/[^\w]/g, ""))
			.filter(Boolean);

		// Return unique keywords (up to 10)
		return [...new Set(keywords)].slice(0, 10);
	}

	/**
	 * Update the side panel with the analysis result
	 * @param content The content of the analysis
	 * @param noteId The ID of the note
	 * @param noteName The name of the note
	 */
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
			// Check if the view is a CommentaryView with updateContent method
			if (!view || !(view instanceof CommentaryView)) {
				throw new AnalysisError(
					"Invalid commentary view",
					"INVALID_VIEW"
				);
			}

			// Cast the view to the correct type
			view.updateContent(content, noteId, noteName);
		} catch (error) {
			this.handleError(error, "Failed to update side panel");
		}
	}


	/**
	 * Clear the cache
	 */
	clearCache(): void {
		this.cacheManager.clear();
	}

	/**
	 * Toggle cache enabled/disabled
	 */
	toggleCache(enabled: boolean): void {
		this.plugin.settings.cacheEnabled = enabled;
	}

	/**
	 * Get cache statistics including size and TTL
	 * @returns Object containing cache size and TTL information
	 */
	getCacheStats(): { size: number; ttl: number } {
		return {
			size: this.cacheManager.getSize(),
			ttl: this.cacheManager.getTTL(),
		};
	}

	/**
	 * Get the analysis history
	 * @returns Array of analysis results
	 */
	getAnalysisHistory(): AnalysisResult[] {
		return this.analysisHistory;
	}

	/**
	 * Add an analysis result to the history
	 * @param result The analysis result to add
	 */
	addToHistory(result: AnalysisResult): void {
		if (!result.noteId) return;

		// Remove any existing analysis for this note
		this.analysisHistory = this.analysisHistory.filter(
			(item) => item.noteId !== result.noteId
		);

		// Add the new analysis
		this.analysisHistory.push(result);

		// Sort by most recent first
		this.analysisHistory.sort((a, b) => b.timestamp - a.timestamp);

		// Limit history to 20 items
		if (this.analysisHistory.length > 20) {
			this.analysisHistory = this.analysisHistory.slice(0, 20);
		}
	}


	/**
	 * Get an analysis result by note ID
	 * @param noteId The ID of the note
	 * @returns The analysis result or undefined if not found
	 */
	getAnalysisForNote(noteId: string): AnalysisResult | undefined {
		return this.analysisHistory.find((item) => item.noteId === noteId);
	}
}
