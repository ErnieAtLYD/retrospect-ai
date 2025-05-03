import { App, Editor, MarkdownView, Notice, TFile } from "obsidian";
import { AnalysisManager } from "./AnalysisManager";
import { LoggingService } from "./LoggingService";
import { RetrospectAISettings, COMMENTARY_VIEW_TYPE } from "../types";
import { ReflectionMemoryManager } from "./ReflectionMemoryManager";

interface CommentaryView {
	getAnalysisHistory: () => AnalysisHistoryItem[];
}

interface AnalysisHistoryItem {
	noteId: string;
	content: string;
}

export class JournalAnalysisService {
	constructor(
		private app: App,
		private settings: RetrospectAISettings,
		private analysisManager: AnalysisManager,
		private logger: LoggingService,
		private reflectionMemoryManager?: ReflectionMemoryManager // Make it optional to maintain backward compatibility
	) {}

	async analyzeDailyJournal(): Promise<void> {
		try {
			const formattedDate = this.getTodayFormattedDate();
			this.logger.debug(
				`Starting daily journal analysis for date: ${formattedDate}`
			);

			const dailyNote = await this.findDailyNote(formattedDate);
			if (!dailyNote) {
				this.handleNoJournalFound(formattedDate);
				return;
			}

			const view = await this.openDailyNote(dailyNote);
			if (!view) {
				this.handleNoEditorView();
				return;
			}

			await this.performAnalysis(view.editor, dailyNote);
		} catch (error) {
			this.handleAnalysisError(error);
		}
	}

	/**
	 * Analyzes the content.
	 * @param content
	 * @param noteId
	 * @param noteName
	 * @returns Promise<void>
	 */
	async analyzeContent(
		content: string,
		noteId?: string,
		noteName?: string
	): Promise<void> {
		try {
			await this.analysisManager.analyzeContent(
				content,
				this.settings.reflectionTemplate,
				this.settings.communicationStyle,
				noteId,
				noteName
			);
		} catch (error) {
			console.error("Error during content analysis:", error);
			throw error;
		}
	}

	/**
	 * Gets today's date in YYYY-MM-DD format
	 */
	private getTodayFormattedDate(): string {
		const today = new Date();
		return today.toISOString().split("T")[0];
	}

	/**
	 * Find the daily note
	 * @param date
	 * @returns
	 */
	private async findDailyNote(date: string): Promise<TFile | null> {
		const files = this.app.vault.getMarkdownFiles();
		return files.find((file) => file.path.includes(date)) || null;
	}

	/**
	 * Open the daily note
	 * @param note
	 * @returns
	 */
	private async openDailyNote(note: TFile): Promise<MarkdownView | null> {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(note);
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	/**
	 * Get the note content
	 * @param note
	 * @returns
	 */
	private async getNoteContent(note: TFile): Promise<string> {
		return await this.app.vault.read(note);
	}

	/**
	 * Handle no journal found
	 * @param date
	 */
	private handleNoJournalFound(date: string): void {
		const message = `No journal entry found for today (${date})`;
		this.logger.warn(message);
		new Notice("No journal entry found for today");
	}

	/**
	 * Handle no editor view
	 */
	private handleNoEditorView(): void {
		const message = "Could not get editor view";
		this.logger.error(message);
		new Notice(message);
	}

	/**
	 * Perform the analysis
	 * @param editor
	 * @param note
	 * @returns Promise<void>
	 */
	private async performAnalysis(editor: Editor, note: TFile): Promise<void> {
		new Notice("Analyzing today's journal entry...");

		const content = await this.getNoteContent(note);
		const notePath = note.path;
		const noteName = note.basename;

		try {
			// Perform the analysis
			await this.analysisManager.analyzeContent(
				content,
				this.settings.reflectionTemplate,
				this.settings.communicationStyle,
				notePath,
				noteName
			);

			// After successful analysis, store the reflection if ReflectionMemoryManager is available
			if (this.reflectionMemoryManager) {
				// Get the latest analysis from the CommentaryView
				const {workspace} = this.app;
				const commentaryLeaves =
					workspace.getLeavesOfType(COMMENTARY_VIEW_TYPE);

				if (commentaryLeaves.length > 0) {
					const commentaryView = commentaryLeaves[0]
						.view as unknown as CommentaryView;
					if (
						commentaryView &&
						typeof commentaryView.getAnalysisHistory === "function"
					) {
						const analysisHistory =
							commentaryView.getAnalysisHistory();

						// Find the analysis for this note
						const analysis = analysisHistory.find(
							(item: AnalysisHistoryItem) =>
								item.noteId === notePath
						);

						if (analysis && analysis.content) {
							// Extract keywords and tags
							const keywords = this.extractKeywords(
								analysis.content
							);
							const tags = this.extractTags(content);

							// Store the reflection
							await this.reflectionMemoryManager.addReflection({
								date: this.getTodayFormattedDate(),
								sourceNotePath: notePath,
								reflectionText: analysis.content,
								tags: tags,
								keywords: keywords,
							});

							this.logger.info(
								`Stored reflection for note: ${noteName}`
							);
						}
					}
				}
			}
		} catch (error) {
			this.handleAnalysisError(error);
		}
	}

	// Helper method to extract keywords from reflection text
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

	// Helper method to extract tags from note content
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

	private handleAnalysisError(error: unknown): void {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		this.logger.error("Error analyzing daily journal", error);
		new Notice(`Error analyzing daily journal: ${errorMessage}`);
	}
}
