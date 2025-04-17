// core/UIManager.ts
import { Notice } from "obsidian";
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
		this.setupRibbonIcons();
	}

	private setupStatusBar(): void {
		try {
			// Try to create a status bar item safely
			if (this.plugin.app.workspace) {
				this.statusBarItem = this.plugin.addStatusBarItem();
				this.statusBarItem.setText("RetrospectAI ready");
			}
		} catch (e) {
			console.log("Status bar API not available, using Notices instead");
		}
	}

	private setupRibbonIcons(): void {
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

	/**
	 * Cleans up the status bar item
	 */
	cleanup() {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
		}
	}
}
