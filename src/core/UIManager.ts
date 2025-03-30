// core/UIManager.ts
import { MarkdownView, Notice } from "obsidian";
import { StreamingEditorManager } from "../services/StreamingManager";
import RetrospectAI from "../main";

export class UIManager {
	private plugin: RetrospectAI;
	public statusBarItem: HTMLElement | null = null;

	constructor(plugin: RetrospectAI) {
		this.plugin = plugin;
	}

	setupUI() {
		// Add ribbon icon
		this.plugin.addRibbonIcon(
			"brain",
			"Analyze Daily Journal",
			async () => {
				try {
					await this.plugin.serviceManager.journalAnalysisService.analyzeDailyJournal();
				} catch (error) {
					// Error handling is done in the analyzeDailyJournal method
				}
			}
		);

		this.setupStatusBar();
		this.addAnalysisRibbonIcon();
	}

	private setupStatusBar() {
		try {
			// Try to create a status bar item safely
			const app = this.plugin.app as any;
			if (app.workspace && app.workspace.statusBar) {
				this.statusBarItem = app.workspace.statusBar.addStatusBarItem();
			}
		} catch (e) {
			console.log("Status bar API not available, using Notices instead");
		}
	}

	private addAnalysisRibbonIcon() {
		const ribbonIcon = this.plugin.addRibbonIcon(
			"brain-cog",
			"Analyze Daily Journal",
			async () => {
				try {
					await this.plugin.serviceManager.journalAnalysisService.analyzeDailyJournal();
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Unknown error";
					new Notice(`Error analyzing daily journal: ${message}`);
					console.error("Error analyzing daily journal", error);
				}
			}
		);

		ribbonIcon.addClass("retrospect-ai-ribbon-icon");
	}

	private addAnalysisRibbonIcon2() {
		const ribbonIconEl = this.plugin.addRibbonIcon(
			"brain-cog",
			"Analyze Daily Journal",
			async () => {
				const { logger } = this.plugin.serviceManager;
				logger.info("Ribbon icon clicked - analyzing daily journal");

				try {
					// Get today's date in YYYY-MM-DD format
					const today = new Date();
					const formattedDate = today.toISOString().split("T")[0];

					// Try to find a daily note with today's date in the filename
					const files = this.plugin.app.vault.getMarkdownFiles();
					const dailyNote = files.find((file) =>
						file.path.includes(formattedDate)
					);

					if (!dailyNote) {
						new Notice("No journal entry found for today");
						logger.warn(
							`No journal entry found for today (${formattedDate})`
						);
						return;
					}

					// Read the file content
					const content = await this.plugin.app.vault.read(dailyNote);

					// Open the file in a new leaf if it's not already open
					const leaf = this.plugin.app.workspace.getLeaf(false);
					await leaf.openFile(dailyNote);

					// Get the editor from the view
					const view =
						this.plugin.app.workspace.getActiveViewOfType(
							MarkdownView
						);
					if (!view) {
						new Notice("Could not get editor view");
						return;
					}

					const { editor } = view;

					// Create a streaming manager for the editor
					const streamingManager = new StreamingEditorManager(editor);

					// Show a notice that analysis is starting
					new Notice("Analyzing today's journal entry...");

					// Analyze the content and stream the results
					await streamingManager.streamAnalysis(
						this.plugin.serviceManager.analyzeContent(content),
						{
							loadingIndicatorPosition: "bottom",
							streamingUpdateInterval: 50,
						}
					);

					new Notice("Journal analysis complete");
				} catch (error) {
					logger.error("Error analyzing daily journal", error);
					new Notice(
						"Error analyzing daily journal: " +
							(error instanceof Error
								? error.message
								: String(error))
					);
				}
			}
		);

		// Add a tooltip
		ribbonIconEl.addClass("retrospect-ai-ribbon-icon");
	}

	/**
	 * Cleans up the status bar item
	 */
	cleanup() {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
		}
	}
}
