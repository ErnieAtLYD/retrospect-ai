// core/ServiceManager.ts
import { AIService, isAIService } from "../services/AIService";
import { OpenAIService } from "../services/OpenAIService";
import { OllamaService } from "../services/OllamaService";
import { PrivacyManager } from "../services/PrivacyManager";
import { AnalysisManager } from "../services/AnalysisManager";
import { WeeklyAnalysisService } from "../services/WeeklyAnalysisService";
import { LoggingService, LogLevel } from "../services/LoggingService";
import { JournalAnalysisService } from "../services/JournalAnalysisService";
import { debounce } from "../utils/debounce";
import RetrospectAI from "../main";
import { AnthropicService } from "../services/AnthropicService";
import { Notice } from "obsidian";

export class ServiceManager {
	private plugin: RetrospectAI;
	private aiService: AIService | undefined;
	public privacyManager!: PrivacyManager;
	public analysisManager!: AnalysisManager;
	public weeklyAnalysisService!: WeeklyAnalysisService;
	public journalAnalysisService!: JournalAnalysisService;
	public logger!: LoggingService;

	constructor(plugin: RetrospectAI) {
		this.plugin = plugin;
		this.initializeLogger();

		// Create a debounced version of service initialization
		this.reinitializeServices = debounce(() => {
			this.initializeServices();
		}, 500);
	}

	private initializeLogger() {
		const logLevel = this.getLogLevel(this.plugin.settings.logLevel);
		this.logger = new LoggingService(
			this.plugin.settings,
			logLevel,
			this.plugin.settings.loggingEnabled
		);
	}

	private initializePrivacyManager() {
		this.privacyManager = new PrivacyManager(
			this.plugin.settings.privateMarker
		);
	}

	private initializeAIService() {
		// Initialize AI service based on settings
		switch (this.plugin.settings.aiProvider) {
			case "openai":
				this.logger.debug("Initializing OpenAI service");
				this.aiService = new OpenAIService(
					this.plugin.settings.apiKey,
					this.plugin.settings.openaiModel
				);
				break;
			case "ollama":
				this.logger.debug(
					"Initializing Ollama service with host: " +
						this.plugin.settings.ollamaHost
				);
				this.aiService = new OllamaService(
					this.plugin.settings.ollamaHost,
					this.plugin.settings.ollamaModel
				);
				break;
			case "anthropic":
				this.logger.debug("Initializing Anthropic service");
				this.aiService = new AnthropicService(
					this.plugin.settings.anthropicApiKey,
					this.plugin.settings.anthropicModel,
					this.logger
				);
				break;
			default:
				const errorMsg = `Unsupported AI provider: ${this.plugin.settings.aiProvider}`;
				this.logger.error(errorMsg);
				throw new Error(errorMsg);
		}

		if (!isAIService(this.aiService)) {
			throw new Error("Failed to initialize AI service");
		}
	}

	private initializeAnalysisManager() {
		this.analysisManager = new AnalysisManager(
			this.aiService as AIService,
			this.privacyManager,
			this.plugin.settings.cacheTTLMinutes
		);
	}

	private initializeWeeklyAnalysisService() {
		this.weeklyAnalysisService = new WeeklyAnalysisService(
			this.plugin.settings,
			this.plugin.app,
			this.privacyManager,
			this.aiService as AIService,
			this.logger
		);
	}

	private initializeJournalAnalysisService() {
		this.journalAnalysisService = new JournalAnalysisService(
			this.plugin.app,
			this.plugin.settings,
			this.analysisManager,
			this.logger
		);
	}

	reinitializeServices = () => {
		// This will be replaced with the debounced version in the constructor
		this.initializeServices();
	};

	private initializeServices() {
		this.logger.info("Initializing Retrospect AI services");

		try {
            this.initializePrivacyManager();
            this.initializeAIService();
            this.initializeAnalysisManager();
            this.initializeWeeklyAnalysisService();
            this.initializeJournalAnalysisService();
            this.logger.info("Services initialized successfully");
    
		} catch (error) {
            console.error("Failed to initialize services:", error);
            new Notice(`Failed to initialize services: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private getLogLevel(level: string): LogLevel {
		switch (level) {
			case "error":
				return LogLevel.ERROR;
			case "warn":
				return LogLevel.WARN;
			case "info":
				return LogLevel.INFO;
			case "debug":
				return LogLevel.DEBUG;
			default:
				return LogLevel.INFO;
		}
	}

	shutdown() {
		this.logger.info("Shutting down Retrospect AI services");

		// Clean up any resources that need explicit cleanup
		this.aiService = undefined;
		this.analysisManager = undefined as any;
		this.weeklyAnalysisService = undefined as any;
		this.journalAnalysisService = undefined as any;

		this.logger.info("Services shutdown complete");
		this.logger = undefined as any;
	}

	async analyzeContent(content: string): Promise<string> {
		try {
			return await this.analysisManager.analyzeContent(
				content,
				this.plugin.settings.reflectionTemplate,
				this.plugin.settings.communicationStyle
			);
		} catch (error) {
			this.logger.error("Error during content analysis:", error);
			throw error;
		}
	}
}
