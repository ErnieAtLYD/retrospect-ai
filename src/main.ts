// main.ts
import {
	Plugin,
	Notice,
	MarkdownView,
	Editor,
	MarkdownFileInfo,
} from "obsidian";
import { RetrospectAISettings, DEFAULT_RETROSPECT_AI_SETTINGS, ExtendedApp } from "./types";
import { RetrospectAISettingTab } from "./settings/settingsTab";
import { AnalysisManager } from "./services/AnalysisManager";
import { AIService } from "./services/AIService";
import { OpenAIService } from "./services/OpenAIService";
import { OllamaService } from "./services/OllamaService";
import { PrivacyManager } from "./services/PrivacyManager";
import { StreamingEditorManager } from "./services/StreamingManager";
import { WeeklyAnalysisService } from "./services/WeeklyAnalysisService";
import { LoggingService, LogLevel } from "./services/LoggingService";
import { JournalAnalysisService } from "./services/JournalAnalysisService";
import { debounce } from "./utils/debounce";
export default class RetrospectAI extends Plugin {
	settings!: RetrospectAISettings;
	private analysisManager!: AnalysisManager;
	private aiService: AIService | undefined;
	private privacyManager!: PrivacyManager;
	private weeklyAnalysisService!: WeeklyAnalysisService;
	private journalAnalysisService!: JournalAnalysisService;
	private statusBarItem: HTMLElement | null = null;
	private logger!: LoggingService;

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_RETROSPECT_AI_SETTINGS,
			await this.loadData()
		);
	}

	// Create a debounced version of the service initialization
	private debouncedInitializeServices = debounce(() => {
		this.initializeServices();
	}, 500); // 500ms delay

	async saveSettings() {
		await this.saveData(this.settings);
		// Use the debounced version instead of calling directly
		this.debouncedInitializeServices();
	}

	async onload() {
		await this.loadSettings();
		this.initializeServices();

        // Register the status bar item correctly if Obsidian's API provides it
        try {
            // Try to create a status bar item safely
            if (this.app.workspace && "statusBar" in this.app.workspace) {
                // @ts-ignore - Handle potential missing statusBar API
                this.statusBarItem = this.app.workspace.statusBar?.addStatusBarItem();
            }
        } catch (e) {
            console.log("Status bar API not available, using Notices instead");
        }

		// Add the ribbon icon
		this.addAnalysisRibbonIcon();

		this.addSettingTab(
			new RetrospectAISettingTab(this.app as ExtendedApp, this)
		);
		this.addCommands();
	}

	onunload() {
		// Remove the status bar item if it exists
		if (this.statusBarItem) {
			this.statusBarItem.remove();
		}
	}

	/**
	 * Initializes the services.
	 */
	private initializeServices() {
		try {
			// Initialize logger first so other services can use it
			const logLevel = this.getLogLevel(this.settings.logLevel);
			this.logger = new LoggingService(
				this.settings,
				logLevel,
				this.settings.loggingEnabled
			);
			
			this.logger.info("Initializing Retrospect AI services");
			this.logger.debug(`Current AI provider: ${this.settings.aiProvider}`);
			
			this.privacyManager = new PrivacyManager(this.settings.privateMarker);

			// Clear existing service before creating a new one
			this.aiService = undefined;

			// Create the appropriate AI service based on settings
			this.createAIService();

			// Validate that we have a valid AI service
			if (!this.aiService) {
				throw new Error("Failed to initialize AI service");
			}

			this.analysisManager = new AnalysisManager(
				this.aiService,
				this.privacyManager,
				this.settings.cacheTTLMinutes
			);
			
			this.weeklyAnalysisService = new WeeklyAnalysisService(
				this.settings,
				this.app,
				this.privacyManager,
				this.aiService,
				this.logger
			);
			
			this.journalAnalysisService = new JournalAnalysisService(
				this.app,
				this.settings,
				this.analysisManager,
				this.logger
			);
			
			this.logger.info("Services initialized successfully");
		} catch (error) {
			console.error("Failed to initialize services:", error);
			new Notice(`Failed to initialize services: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	
	/**
	 * Converts string log level to enum value
	 * @param level - The log level to convert
	 * @returns The converted log level
	 * @throws Error if the log level is not valid
	 */
	/**
	 * Creates the appropriate AI service based on settings
	 */
	private createAIService(): void {
		try {
			switch (this.settings.aiProvider) {
				case "openai":
					this.logger.debug("Initializing OpenAI service");
					if (!this.settings.apiKey) {
						throw new Error("OpenAI API key is required");
					}
					this.aiService = new OpenAIService(
						this.settings.apiKey,
						this.settings.openaiModel
					);
					break;
				case "ollama":
					this.logger.debug("Initializing Ollama service with host: " + this.settings.ollamaHost);
					if (!this.settings.ollamaHost) {
						throw new Error("Ollama host URL is required");
					}
					this.aiService = new OllamaService(
						this.settings.ollamaHost,
						this.settings.ollamaModel,
						this.logger
					);
					break;
				default:
					const errorMsg = `Unsupported AI provider: ${this.settings.aiProvider}`;
					this.logger.error(errorMsg);
					throw new Error(errorMsg);
			}
		} catch (error) {
			this.logger.error("Failed to create AI service", error);
			throw error;
		}
	}

	private getLogLevel(level: string): LogLevel {
		switch (level) {
			case "error": return LogLevel.ERROR;
			case "warn": return LogLevel.WARN;
			case "info": return LogLevel.INFO;
			case "debug": return LogLevel.DEBUG;
			default: return LogLevel.INFO;
		}
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
				const streamingManager = new StreamingEditorManager(editor);

				try {
					// Create a promise for the analysis
					const analysisPromise = this.journalAnalysisService.analyzeContent(content);

					// Use streaming manager to handle the updates
					await streamingManager.streamAnalysis(analysisPromise, {
						streamingUpdateInterval: 150,
						loadingIndicatorPosition: "cursor",
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
		this.addCommand({
			id: "analyze-past-week",
			name: "Analyze Past Week",
			callback: async () => {
				// Create a Notice and update status bar if available
				const loadingNotice = new Notice("Analyzing past week...", 0);
				if (this.statusBarItem) {
					this.statusBarItem.setText("Analyzing past week...");
				}
				
				try {
					await this.weeklyAnalysisService.runWeeklyAnalysis();
					
					loadingNotice.hide();
					new Notice("Weekly analysis complete!", 3000);
				} catch (error) {
					const message = error instanceof Error ? error.message : "Unknown error";
					loadingNotice.hide();
					new Notice(`Weekly analysis failed: ${message}`, 5000);
				} finally {
					// Clear status bar if it was used
					if (this.statusBarItem) {
						this.statusBarItem.setText("");
					}
				}
			},
		});
	}





	/**
	 * Adds a ribbon icon for quick analysis of the daily journal
	 */
	private addAnalysisRibbonIcon() {
		const ribbonIconEl = this.addRibbonIcon(
			'brain-cog', // You can choose a different icon from Obsidian's icon set
			'Analyze Daily Journal',
			async () => {
				try {
					await this.journalAnalysisService.analyzeDailyJournal();
				} catch (error) {
					this.logger.error("Error analyzing daily journal", error);
					new Notice(`Error analyzing daily journal: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		);
		
		// Add a tooltip
		ribbonIconEl.addClass('retrospect-ai-ribbon-icon');
	}

	// Remove duplicate method - use journalAnalysisService.analyzeContent instead
}
