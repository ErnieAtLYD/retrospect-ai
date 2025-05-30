import { App, Editor, MarkdownView, Notice, TFile } from "obsidian";
import { AnalysisManager } from "./AnalysisManager";
import { LoggingService } from "./LoggingService";
import { RetrospectAISettings } from "../types";
import { ReflectionMemoryManager } from "./ReflectionMemoryManager";

/**
 * Service for analyzing the daily journal
 */
export class JournalAnalysisService {
	constructor(
		private app: App,
		private settings: RetrospectAISettings,
		private analysisManager: AnalysisManager,
		private logger?: LoggingService,
		private reflectionMemoryManager?: ReflectionMemoryManager // Make it optional to maintain backward compatibility
	) {}

	/**
	 * Analyzes the daily journal
	 * @returns {Promise<void>}
	 */
	async analyzeDailyJournal(): Promise<void> {
		try {
			this.logger?.debug("Logger initialized:", {
				enabled: this.logger["enabled"],
				level: this.logger["level"]
			});
			
			const formattedDate = this.getTodayFormattedDate();
			this.logger?.debug(
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
	 * Gets today's date in YYYY-MM-DD format
	 */
	private getTodayFormattedDate(): string {
		const today = new Date();
		return today.toISOString().split("T")[0];
	}

	/**
	 * Find the daily note
	 * @param date {string} The date to find the daily note for
	 * @returns {Promise<TFile | null>} The daily note file or null if not found
	 */
	private async findDailyNote(date: string): Promise<TFile | null> {
		const files = this.app.vault.getMarkdownFiles();
		return files.find((file) => file.path.includes(date)) || null;
	}

	/**
	 * Open the daily note
	 * @param note {TFile} The daily note file
	 * @returns {Promise<MarkdownView | null>} The markdown view of the daily note
	 */
	private async openDailyNote(note: TFile): Promise<MarkdownView | null> {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(note);
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	/**
	 * Get the note content
	 * @param note {TFile} The daily note file
	 * @returns {Promise<string>} The content of the note
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
		this.logger?.warn(message);
		new Notice("No journal entry found for today");
	}

	/**
	 * Handle no editor view
	 */
	private handleNoEditorView(): void {
		const message = "Could not get editor view";
		this.logger?.error(message);
		new Notice(message);
	}


	/**
	 * Performs the analysis of the daily journal entry
	 * 
	 * @param editor {Editor} The editor instance
	 * @param note {TFile} The daily note file
	 * @returns {Promise<void>}
	 * @throws {JournalAnalysisError} If the daily note is not found
	 */
	private async performAnalysis(editor: Editor, note: TFile): Promise<void> {
		new Notice("Analyzing today's journal entry...");

		const content = await this.getNoteContent(note);
		const notePath = note.path;
		const noteName = note.basename;
		this.logger?.info(`performAnalysis: ${noteName}`);
		this.logger?.info(`performAnalysis: ${notePath}`);
		this.logger?.info(`performAnalysis: ${content}`);
		try {
			// Perform the analysis - the AnalysisManager now handles storing the reflection
			// in the ReflectionMemoryManager automatically, so we don't need to do it here
			await this.analysisManager.analyzeContent(
				content,
				this.settings.reflectionTemplate,
				this.settings.communicationStyle,
				notePath,
				noteName
			);

			this.logger?.info(`Analysis complete for note: ${noteName}`);
		} catch (error) {
			this.handleAnalysisError(error);
		}
	}

	private handleAnalysisError(error: unknown): void {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		this.logger?.error("Error analyzing daily journal", error);
		new Notice(`Error analyzing daily journal: ${errorMessage}`);
	}
}
