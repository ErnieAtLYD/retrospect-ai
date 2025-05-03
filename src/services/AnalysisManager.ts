// src/services/AnalysisManager.ts

import { Notice } from "obsidian";
import { AIService } from "./AIService";
import { PrivacyManager } from "./PrivacyManager";
import { CacheManager } from "./CacheManager";
import RetrospectAI from "../main";
import { ReflectionMemoryManager } from "./ReflectionMemoryManager";
import { CommentaryView } from "../views/CommentaryView";

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
 * Manages the analysis of content using AI services and caching
 * 
 * @param plugin {RetrospectAI} The main plugin instance
 * @param aiService {AIService} The AI service to use
 * @param privacyManager {PrivacyManager} The privacy manager to use
 * @param cacheTTLMinutes {number} The time to live for the cache
 * @param cacheMaxSize {number} The maximum size of the cache
 */
export class AnalysisManager {
	private readonly cacheManager: CacheManager<AnalysisResult>;
	private readonly plugin: RetrospectAI;
	private readonly aiService: AIService;
	private readonly privacyManager: PrivacyManager;
	private reflectionMemoryManager: ReflectionMemoryManager | null = null;
	private analysisHistory: AnalysisResult[] = [];
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

	/**
	 * Handle an error by displaying a notice and logging the error
	 * @param error {unknown} The error to handle
	 * @param fallbackMessage {string} The fallback message to display if the error is not an AnalysisError
	 */
	private handleError(error: unknown, fallbackMessage: string): void {
		if (error instanceof AnalysisError) {
			new Notice(error.message);
		} else {
			new Notice(fallbackMessage);
			console.error(fallbackMessage, error);
		}
	}

	/**
	 * Validate the analysis request
	 * @param request {AnalysisRequest} The analysis request
	 * @throws {AnalysisError} If the request is invalid
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
	 * Analyzes the content of a note using the AI service.
	 * Stores the analysis in ReflectionMemoryManager if available.
	 * Calls updateSidePanel to update the side panel with the analysis.
	 * Caches the result of the analysis.
	 * 
	 * @param content - The content of the note to analyze.
	 * @param template - The template to use for the analysis.
	 * @param style - The style of the analysis.
	 * @param noteId - The ID of the note to analyze.
	 * @param noteName - The name of the note to analyze.
	 * @returns A promise that resolves to the analysis result when complete.
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

			const sanitizedContent =
				this.privacyManager.removePrivateSections(content);
			const cacheKey = this.cacheManager.generateKey(
				sanitizedContent,
				template,
				style
			);

			const cachedResult = this.cacheManager.get(cacheKey);
			if (cachedResult) {
				// Add cached result to history in case it's not there
				this.addToHistory(cachedResult);
				await this.updateSidePanel(
					cachedResult.content,
					noteId,
					noteName
				);
				return cachedResult;
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
			
			// Add to analysis history
			this.addToHistory(analysisResult);
			
			// Store in ReflectionMemoryManager if available
			if (this.reflectionMemoryManager && noteId) {
				try {
					// Extract tags and keywords
					const tags = this.extractTags(content);
					const keywords = this.extractKeywords(result);
					
					// Get today's date in YYYY-MM-DD format
					const today = new Date();
					const formattedDate = today.toISOString().split("T")[0];
					
					// Store the reflection
					await this.reflectionMemoryManager.addReflection({
						date: formattedDate,
						sourceNotePath: noteId,
						reflectionText: result,
						tags: tags,
						keywords: keywords,
					});
				} catch (error) {
					console.error("Failed to store reflection in memory manager:", error);
					// Don't block the analysis flow if reflection storage fails
				}
			}
			
			await this.updateSidePanel(result, noteId, noteName);
			return analysisResult;
		} catch (error) {
			this.handleError(
				error,
				"An unexpected error occurred during analysis"
			);
			throw error; // Rethrow to allow proper error handling
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
	 * @param content {string} The content of the note
	 * @param noteId {string} The id of the note
	 * @param noteName {string} The name of the note
	 * @returns {Promise<void>}
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
	 * Set the reflection memory manager
	 * @param reflectionMemoryManager {ReflectionMemoryManager} The reflection memory manager
	 * @returns {void}
	 */
	setReflectionMemoryManager(
		reflectionMemoryManager: ReflectionMemoryManager
	): void {
		this.reflectionMemoryManager = reflectionMemoryManager;
	}

	/**
	 * Clear the cache
	 */
	clearCache(): void {
		this.cacheManager.clear();
	}

	/**
	 *
	 * @returns
	 */
	getCacheStats(): { size: number; ttl: number } {
		return {
			size: this.cacheManager.getSize(),
			ttl: this.cacheManager.getTTL(),
		};
	}
	
	/**
	 * Get the analysis history
	 * @returns {AnalysisResult[]} The analysis history
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
		this.analysisHistory = this.analysisHistory.filter(item => 
			item.noteId !== result.noteId
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
		return this.analysisHistory.find(item => item.noteId === noteId);
	}
}