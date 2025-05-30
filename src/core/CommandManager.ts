// core/CommandManager.ts
import {
	Editor,
	MarkdownView,
	Notice,
	MarkdownFileInfo,
	TFile,
} from "obsidian";
import RetrospectAI from "../main";
import { registerCacheCommands } from "./CacheCommands";

export class CommandManager {
	constructor(private plugin: RetrospectAI) {}

	/**
	 * Registers all plugin commands
	 */
	registerCommands(): void {
		this.registerAnalyzeNoteCommand();
		this.registerWeeklyAnalysisCommand();
		registerCacheCommands(this.plugin);
	}

	/**
	 * Registers the analyze current note command
	 */
	private registerAnalyzeNoteCommand(): void {
		this.plugin.addCommand({
			id: "analyze-current-note",
			name: "Analyze Current Note",
			editorCallback: this.handleAnalyzeNote.bind(this),
		});
	}

	/**
	 * Handles the analyze note command
	 */
	private async handleAnalyzeNote(
		editor: Editor,
		ctx: MarkdownView | MarkdownFileInfo
	): Promise<void> {
		const file = this.getFileOrNotice(ctx);
		if (!file) return;

		const notice = new Notice("Analyzing note...", 0);
		try {
			this.ensureAnalysisManager();
			await this.plugin.serviceManager!.analysisManager!.analyzeContent(
				editor.getValue(),
				this.plugin.settings.reflectionTemplate,
				this.plugin.settings.communicationStyle,
				file.path,
				file.basename
			);
			notice.hide();
			new Notice(
				"Analysis complete! Check the side panel for results.",
				3000
			);
		} catch (error) {
			notice.hide();
			this.handleError("Analysis failed", error);
		}
	}

	/**
	 * Ensures the analysis manager is initialized
	 * @throws Error if analysis manager is not available
	 */
	private ensureAnalysisManager(): void {
		if (!this.plugin.serviceManager?.analysisManager) {
			const details = {
				service: !!this.plugin.serviceManager,
				manager: !!this.plugin.serviceManager?.analysisManager,
				settings: this.plugin.settings,
			};
			this.plugin.logger?.error(
				"Analysis init state",
				new Error(JSON.stringify(details))
			);
			throw new Error(
				"Analysis service not initialized. See logs for details."
			);
		}
	}

	/**
	 * Get the file from the context or show a notice if the context is not a Markdown view or the file is not found
	 * @param ctx The context of the command
	 * @returns The file or null if the context is not a Markdown view or the file is not found
	 */
	private getFileOrNotice(
		ctx: MarkdownView | MarkdownFileInfo
	): TFile | null {
		if (!(ctx instanceof MarkdownView)) {
			new Notice(
				"This command can only be used in a Markdown view.",
				3000
			);
			return null;
		}
		const file = ctx.file;
		if (!file) {
			new Notice("No file found in the current view.", 3000);
			return null;
		}
		return file;
	}

	/**
	 * Handles errors consistently across all commands
	 * @param base Base error message
	 * @param error The error that occurred
	 */
	private handleError(base: string, error: unknown): void {
		const msg = error instanceof Error ? error.message : String(error);
		new Notice(`${base}: ${msg}`, 5000);
		this.plugin.logger?.error(
			base,
			error instanceof Error ? error : new Error(msg)
		);
	}

	/**
	 * Registers the weekly analysis command
	 */
	private registerWeeklyAnalysisCommand(): void {
		this.plugin.addCommand({
			id: "analyze-past-week",
			name: "Analyze Past Week",
			callback: this.handleWeeklyAnalysis.bind(this),
		});
	}

	/**
	 * Handles the weekly analysis command
	 */
	private async handleWeeklyAnalysis(): Promise<void> {
		const loadingNotice = new Notice("Analyzing past week...", 0);

		this.updateStatusBar("Analyzing past week...");

		try {
			if (!this.plugin.serviceManager?.weeklyAnalysisService) {
				throw new Error("Weekly analysis service not initialized");
			}

			await this.plugin.serviceManager.weeklyAnalysisService.runWeeklyAnalysis();
			loadingNotice.hide();
			new Notice("Weekly analysis complete!", 3000);
		} catch (error) {
			loadingNotice.hide();
			this.handleError("Weekly analysis failed", error);
		} finally {
			this.updateStatusBar("");
		}
	}

	/**
	 * Updates the status bar with the given text
	 * @param text Text to display in status bar
	 */
	private updateStatusBar(text: string): void {
		if (this.plugin.uiManager.statusBarItem) {
			this.plugin.uiManager.statusBarItem.setText(text);
		}
	}
}
