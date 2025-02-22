// main.ts
import {
	Plugin,
	Notice,
	TFile,
	MarkdownView,
	Editor,
	MarkdownFileInfo,
} from "obsidian";
import { RecapitanSettings, DEFAULT_SETTINGS, ExtendedApp } from "./types";
import { RecapitanSettingTab } from "./settings/settingsTab";
import { AnalysisManager } from "./services/AnalysisManager";
import { OpenAIService, AIService } from "./services/AIService";
import { OllamaService } from "./services/OllamaService";
import { PrivacyManager } from "./services/PrivacyManager";
import { StreamingEditorManager } from "services/StreamingManager";

export default class Recapitan extends Plugin {
	settings!: RecapitanSettings;
	private analysisManager!: AnalysisManager;
	private aiService!: AIService;
	private privacyManager!: PrivacyManager;

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();
		this.initializeServices();
		this.addSettingTab(
			new RecapitanSettingTab(this.app as ExtendedApp, this)
		);
		this.addCommands();
	}

	/**
	 * Initializes the services.
	 */
	private initializeServices() {
		this.privacyManager = new PrivacyManager(this.settings.privateMarker);

		switch (this.settings.aiProvider) {
			case "openai":
				this.aiService = new OpenAIService(
					this.settings.apiKey,
					this.settings.model
				);
				break;
			case "ollama":
				this.aiService = new OllamaService(
					this.settings.ollamaHost,
					this.settings.model
				);
				break;
			default:
				throw new Error("Unsupported AI provider");
		}

		this.analysisManager = new AnalysisManager(
			this.aiService,
			this.privacyManager
		);
	}

	/**
	 * Adds the commands to the plugin.
	 */
	private addCommands() {
		// Add command for manual analysis
		this.addCommand({
			id: "analyze-current-note",
			name: "Analyze Current Note",
			editorCallback: async (
				editor: Editor,
				ctx: MarkdownView | MarkdownFileInfo
			) => {
				if (!(ctx instanceof MarkdownView)) {
					new Notice(
						"This command can only be used in a Markdown view.",
						5000
					);
					return;
				}

				const content = editor.getValue();
				const streamingManager = new StreamingEditorManager(
					editor,
					this.app
				);

				try {
					// Create a promise for the analysis
					const analysisPromise = this.analyzeContent(content);

					// Use streaming manager to handle the updates
					await streamingManager.streamAnalysis(analysisPromise, {
						streamingUpdateInterval: 150,
						loadingIndicatorPosition: "cursor",
						chunkSize: 75,
					});
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Unknown error";
					new Notice(`Analysis failed: ${message}`, 5000);
				}
			},
		});

		// Add command for weekly analysis
		// Weekly analysis command remains mostly the same
		this.addCommand({
			id: "analyze-past-week",
			name: "Analyze Past Week",
			callback: async () => {
				const statusBar = (
					this.app as ExtendedApp
				).statusBar.addStatusBarItem();
				statusBar.setText("Analyzing past week...");

				try {
					const entries = await this.getPastWeekEntries();
					if (entries.length === 0) {
						new Notice(
							"No journal entries found for the past week",
							5000
						);
						return;
					}

					const analysis = await this.analyzeWeeklyContent(entries);
					await this.createWeeklyReflectionNote(analysis);
					new Notice("Weekly analysis complete!", 3000);
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: "Unknown error";
					new Notice(`Weekly analysis failed: ${message}`, 5000);
				} finally {
					statusBar.remove();
				}
			},
		});
	}

	/**
	 * Gets the past week's entries.
	 * @returns
	 */
	private async getPastWeekEntries(): Promise<
		{ date: string; content: string }[]
	> {
		const files = this.app.vault.getMarkdownFiles();
		const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

		const entries = await Promise.all(
			files
				.filter((file) => {
					const match = file.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
					if (!match) return false;
					const fileDate = new Date(match[1]).getTime();
					return fileDate >= oneWeekAgo && fileDate <= Date.now();
				})
				.map(async (file) => ({
					date: file.name.replace(".md", ""),
					content: await this.app.vault.read(file),
				}))
		);
		return entries.sort((a, b) => a.date.localeCompare(b.date));
	}

	/**
	 * Analyzes the weekly content.
	 * @param entries
	 * @returns
	 */
	private async analyzeWeeklyContent(
		entries: { date: string; content: string }[]
	): Promise<string> {
		const sanitizedEntries = entries.map((entry) => ({
			date: entry.date,
			content: this.privacyManager.removePrivateSections(entry.content),
		}));

		const formattedContent = sanitizedEntries
			.map((entry) => `## ${entry.date}\n\n${entry.content}`)
			.join("\n\n");

		return await this.aiService.analyze(
			formattedContent,
			this.settings.weeklyReflectionTemplate,
			this.settings.communicationStyle
		);
	}

	/**
	 * Creates a weekly reflection note.
	 * @param analysis
	 */
	private async createWeeklyReflectionNote(analysis: string): Promise<void> {
		const today = new Date().toISOString().split("T")[0];
		const fileName = `Weekly Reflections/${today} - Weekly Reflection.md`;

		// Create Weekly Reflections folder if it doesn't exist
		if (!(await this.app.vault.adapter.exists("Weekly Reflections"))) {
			await this.app.vault.createFolder("Weekly Reflections");
		}

		const content = `# Weekly Reflection - ${today}\n\n${analysis}`;
		await this.app.vault.create(fileName, content);

		// Open the new note
		const file = this.app.vault.getAbstractFileByPath(fileName);
		if (file instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(file);
		}
	}

	private async analyzeContent(content: string): Promise<string> {
		try {
			// Remove private sections as before
			const sanitizedContent =
				this.privacyManager.removePrivateSections(content);

			// Use your existing AIService
			return await this.aiService.analyze(
				sanitizedContent,
				this.settings.reflectionTemplate,
				this.settings.communicationStyle
			);
		} catch (error) {
			console.error("Error during content analysis:", error);
			throw error; // Let the streaming manager handle the error
		}
	}
}
