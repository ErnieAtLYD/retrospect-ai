// core/UIManager.ts
import { Notice, WorkspaceLeaf } from "obsidian";
import RetrospectAI from "../main";
import { COMMENTARY_VIEW_TYPE } from "../types";

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
					if (!this.plugin.serviceManager?.journalAnalysisService) {
						throw new Error("Service not initialized");
					}
					await this.plugin.serviceManager.journalAnalysisService.analyzeDailyJournal();
				} catch {
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
		} catch {
			console.log("Status bar API not available, using Notices instead");
		}
	}

	private setupRibbonIcons(): void {
		const ribbonIcon = this.plugin.addRibbonIcon(
			"brain-cog",
			"Analyze Daily Journal",
			async () => {
				try {
					if (!this.plugin.serviceManager?.journalAnalysisService) {
						throw new Error("Service not initialized");
					}
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
	 * Get or create a commentary view leaf
	 * @returns {Promise<WorkspaceLeaf | null>} The commentary view leaf
	 */
	private async getOrCreateLeaf(): Promise<WorkspaceLeaf | null> {
		const { workspace } = this.plugin.app;
		if (!workspace) {
			console.error("Workspace not initialized");
			return null;
		}

		let leaf = workspace.getLeavesOfType(COMMENTARY_VIEW_TYPE)[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false) || workspace.getLeaf("split", "vertical");
			if (!leaf) {
				console.error("Could not create a new leaf");
				return null;
			}
			await leaf.setViewState({
				type: COMMENTARY_VIEW_TYPE,
				active: true,
			});
			workspace.setActiveLeaf(leaf, { focus: false });
		}
		return leaf;
	}

	/**
	 * Activates the commentary view in the right sidebar
	 */
	async activateView(): Promise<void> {
		const { workspace } = this.plugin.app;
		try {
			const leaf = await this.getOrCreateLeaf();
			if (leaf) {
				workspace.revealLeaf(leaf);
			}
		} catch (error) {
			console.error("Error creating view:", error);
		}
	}

	/**
	 * Cleans up the status bar item and view
	 */
	cleanup() {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
		}
	}
}
