// core/CommandManager.ts
import { Editor, MarkdownView, Notice, MarkdownFileInfo } from "obsidian";
import RetrospectAI from "../main";
import { registerCacheCommands } from "./CacheCommands";

export class CommandManager {

	constructor(private plugin: RetrospectAI) {}

	registerCommands() {
		this.registerAnalyzeNoteCommand();
		this.registerWeeklyAnalysisCommand();
		registerCacheCommands(this.plugin);
	}

	private registerAnalyzeNoteCommand() {
		this.plugin.addCommand({
		  id: 'analyze-current-note',
		  name: 'Analyze Current Note',
		  editorCallback: this.handleAnalyzeNote.bind(this),
		});
	}

	private async handleAnalyzeNote(editor: Editor, ctx: MarkdownView | MarkdownFileInfo) {
		let file = this.getFileOrNotice(ctx);
		if (!file) return;
	
		const notice = new Notice('Analyzing note...', 0);
		try {
		  this.ensureAnalysisManager();
		  await this.plugin.serviceManager!.analysisManager!.analyzeContent(
			editor.getValue(),
			this.plugin.settings.reflectionTemplate,
			this.plugin.settings.communicationStyle,
			file.path,
			file.basename,
		  );
		  notice.hide();
		  new Notice('Analysis complete! Check the side panel for results.', 3000);
		} catch (e) {
		  notice.hide();
		  this.handleError('Analysis failed', e);
		}
	  }

	private registerWeeklyAnalysisCommand() {
		this.plugin.addCommand({
			id: "analyze-past-week",
			name: "Analyze Past Week",
			callback: async () => {
				const loadingNotice = new Notice("Analyzing past week...", 0);
				if (this.plugin.uiManager.statusBarItem) {
					this.plugin.uiManager.statusBarItem.setText(
						"Analyzing past week..."
					);
				}

				try {
					await this.plugin.serviceManager?.weeklyAnalysisService?.runWeeklyAnalysis();

					loadingNotice.hide();
					new Notice("Weekly analysis complete!", 3000);
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Unknown error";
					loadingNotice.hide();
					new Notice(`Weekly analysis failed: ${message}`, 5000);
				} finally {
					if (this.plugin.uiManager.statusBarItem) {
						this.plugin.uiManager.statusBarItem.setText("");
					}
				}
			},
		});
	}
	private registerCacheCommands() {
		// Clear cache command
		this.plugin.addCommand({
			id: "clear-analysis-cache",
			name: "Clear Analysis Cache",
			callback: () => {
				this.plugin.serviceManager?.analysisManager?.clearCache();
				new Notice("Analysis cache cleared!", 3000);
			},
		});

		// Toggle cache command
		this.plugin.addCommand({
			id: "toggle-analysis-cache",
			name: "Toggle Analysis Cache",
			callback: async () => {
				const currentState = this.plugin.settings.cacheEnabled;
				this.plugin.settings.cacheEnabled = !currentState;
				await this.plugin.saveSettings();

				const status = this.plugin.settings.cacheEnabled
					? "enabled"
					: "disabled";
				new Notice(`Analysis cache ${status}!`, 3000);
			},
		});

		// Show cache stats command
		this.plugin.addCommand({
			id: "show-cache-stats",
			name: "Show Cache Stats",
			callback: () => {
				const stats =
					this.plugin.serviceManager?.analysisManager?.getCacheStats();
				if (stats) {
					const enabled = this.plugin.settings.cacheEnabled
						? "enabled"
						: "disabled";
					new Notice(
						`Cache: ${enabled}, Size: ${
							stats.size
						}, TTL: ${Math.round(stats.ttl / 60000)}min`,
						5000
					);
				} else {
					new Notice("Cache stats unavailable", 3000);
				}
			},
		});
	}
}
