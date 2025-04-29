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
import {
	ServiceInitializationError,
	AIServiceError,
	AnalysisError,
} from "../errors/ServiceErrors";

export class ServiceManager {
	private plugin: RetrospectAI;
	private aiService: AIService | undefined;
	public privacyManager!: PrivacyManager;
	public analysisManager!: AnalysisManager | undefined;
	public weeklyAnalysisService!: WeeklyAnalysisService | undefined;
	public journalAnalysisService!: JournalAnalysisService | undefined;
	public logger!: LoggingService | undefined;

	constructor(plugin: RetrospectAI) {
		this.plugin = plugin;
		this.aiService = undefined;
		this.analysisManager = undefined;
		this.weeklyAnalysisService = undefined;
		this.journalAnalysisService = undefined;
		this.logger = undefined;
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
		try {
			this.logger?.debug("Starting AI service initialization");

			if (!this.privacyManager) {
				throw new Error(
					"Privacy Manager must be initialized before AI Service"
				);
			}

			// Initialize AI service based on settings
			switch (this.plugin.settings.aiProvider) {
				case "openai":
					this.logger?.debug(
						"Initializing OpenAI service with model:",
						this.plugin.settings.openaiModel
					);
					if (!this.plugin.settings.apiKey) {
						throw new Error(
							"OpenAI API key is required but not set"
						);
					}
					this.aiService = new OpenAIService(
						this.plugin.settings.apiKey,
						this.plugin.settings.openaiModel
					);
					break;
				case "ollama":
					this.logger?.debug(
						"Initializing Ollama service with host:",
						this.plugin.settings.ollamaHost
					);
					this.aiService = new OllamaService(
						this.plugin.settings.ollamaHost,
						this.plugin.settings.ollamaModel
					);
					break;
				case "anthropic":
					this.logger?.debug(
						"Initializing Anthropic service with model:",
						this.plugin.settings.anthropicModel
					);
					if (!this.plugin.settings.anthropicApiKey) {
						throw new Error(
							"Anthropic API key is required but not set"
						);
					}
					this.aiService = new AnthropicService(
						this.plugin.settings.anthropicApiKey,
						this.plugin.settings.anthropicModel,
						this.logger
					);
					break;
				default:
					const errorMsg = `Unsupported AI provider: ${this.plugin.settings.aiProvider}`;
					this.logger?.error(errorMsg);
					throw new AIServiceError(errorMsg);
			}

			if (!isAIService(this.aiService)) {
				throw new AIServiceError(
					"Failed to initialize AI service - service is not properly configured"
				);
			}

			this.logger?.debug("AI service initialized successfully");
		} catch (error) {
			this.logger?.error(
				"Failed to initialize AI service",
				error instanceof Error ? error : new Error(String(error))
			);
			throw error;
		}
	}

	/**
	 * Initialize the analysis manager
	 * @returns {void}
	 * @throws {ServiceInitializationError} if the service fails to initialize
	 * @throws {AIServiceError} if the AI service is not initialized
	 * @throws {LoggingServiceError} if the logging service is not initialized
	 * @throws {PrivacyManagerError} if the privacy manager is not initialized
	 * @throws {AnalysisManagerError} if the analysis manager is not initialized
	 * @throws {Error} if the service fails to initialize
	 *
	 */
	private initializeAnalysisManager() {
		try {
			this.logger?.debug("Starting Analysis Manager initialization");

			if (!this.privacyManager) {
				throw new Error(
					"Privacy Manager must be initialized before Analysis Manager"
				);
			}

			if (!this.aiService) {
				throw new Error(
					"AI Service must be initialized before Analysis Manager"
				);
			}

			this.analysisManager = new AnalysisManager(
				this.plugin,
				this.aiService as AIService,
				this.privacyManager,
				this.plugin.settings.cacheTTLMinutes
			);

			this.logger?.debug("Analysis Manager initialized successfully");
		} catch (error) {
			this.logger?.error(
				"Failed to initialize Analysis Manager",
				error instanceof Error ? error : new Error(String(error))
			);
			throw error;
		}
	}

	/**
	 * Initialize the weekly analysis service
	 * @returns {void}
	 * @throws {ServiceInitializationError} if the service fails to initialize
	 * @throws {AIServiceError} if the AI service is not initialized
	 * @throws {LoggingServiceError} if the logging service is not initialized
	 * @throws {PrivacyManagerError} if the privacy manager is not initialized
	 * @throws {AnalysisManagerError} if the analysis manager is not initialized
	 * @throws {WeeklyAnalysisServiceError} if the weekly analysis service is not initialized
	 * @throws {Error} if the service fails to initialize
	 *
	 */
	private initializeWeeklyAnalysisService() {
		this.weeklyAnalysisService = new WeeklyAnalysisService(
			this.plugin.settings,
			this.plugin.app,
			this.privacyManager,
			this.aiService as AIService,
			this.logger as LoggingService
		);
	}

	/**
	 * Initialize the journal analysis service
	 * @returns {void}
	 * @throws {ServiceInitializationError} if the service fails to initialize
	 * @throws {AIServiceError} if the AI service is not initialized
	 * @throws {LoggingServiceError} if the logging service is not initialized
	 * @throws {PrivacyManagerError} if the privacy manager is not initialized
	 * @throws {AnalysisManagerError} if the analysis manager is not initialized
	 * @throws {Error} if the service fails to initialize
	 *
	 */
	private initializeJournalAnalysisService() {
		this.journalAnalysisService = new JournalAnalysisService(
			this.plugin.app,
			this.plugin.settings,
			this.analysisManager as AnalysisManager,
			this.logger as LoggingService,
			this.plugin.reflectionMemoryManager // Add the ReflectionMemoryManager
		);
	}

	/**
	 * Reinitialize the services
	 * @returns {void}
	 * @throws {ServiceInitializationError} if the service fails to initialize
	 * @throws {AIServiceError} if the AI service is not initialized
	 * @throws {LoggingServiceError} if the logging service is not initialized
	 * @throws {PrivacyManagerError} if the privacy manager is not initialized
	 * @throws {AnalysisManagerError} if the analysis manager is not initialized
	 * @throws {WeeklyAnalysisServiceError} if the weekly analysis service is not initialized
	 * @throws {JournalAnalysisServiceError} if the journal analysis service is not initialized
	 * @throws {Error} if the service fails to initialize
	 *
	 */
	reinitializeServices = () => {
		// This will be replaced with the debounced version in the constructor
		this.initializeServices();
	};

	private initializeService(serviceName: string, initFn: () => void): void {
		this.logger?.debug(`Initializing ${serviceName}...`);
		try {
			initFn();
			this.logger?.debug(`${serviceName} initialized successfully`);
		} catch (error) {
			this.logger?.error(
				`Failed to initialize ${serviceName}`,
				error instanceof Error ? error : new Error(String(error))
			);
			throw error;
		}
	}

	/**
	 * Initialize the services
	 * @returns {void}
	 * @throws {ServiceInitializationError} if the service fails to initialize
	 * @throws {AIServiceError} if the AI service is not initialized
	 * @throws {LoggingServiceError} if the logging service is not initialized
	 * @throws {PrivacyManagerError} if the privacy manager is not initialized
	 * @throws {AnalysisManagerError} if the analysis manager is not initialized
	 * @throws {WeeklyAnalysisServiceError} if the weekly analysis service is not initialized
	 * @throws {JournalAnalysisServiceError} if the journal analysis service is not initialized
	 * @throws {Error} if the service fails to initialize
	 *
	 */
	private initializeServices() {
		this.logger?.info("Initializing Retrospect AI services");
		try {
			this.initializeService("Privacy Manager", () => this.initializePrivacyManager());
			this.initializeService("AI Service", () => this.initializeAIService());
			this.initializeService("Analysis Manager", () => this.initializeAnalysisManager());
			this.initializeService(
				"Weekly Analysis Service",
				() => this.initializeWeeklyAnalysisService()
			);
			this.initializeService(
				"Journal Analysis Service",
				() => this.initializeJournalAnalysisService()
			);
			this.logger?.info("All services initialized successfully");
		} catch (error) {
			this.logger?.error("Failed to initialize services:", error);
			if (error instanceof AIServiceError) {
				throw new AIServiceError(`AI Service Error: ${error.message}`);
			} else if (error instanceof AnalysisError) {
				throw new AnalysisError(`Analysis Error: ${error.message}`);
			} else {
				throw new ServiceInitializationError(
					`Failed to initialize services: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
		}
	}

	/**
	 * Get the log level
	 * @param {string} level - The log level
	 * @returns {LogLevel} The log level
	 *
	 */
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

	/**
	 * Shutdown the services
	 * @returns {void}
	 * @throws {LoggingServiceError} if the logging service is not initialized
	 * @throws {Error} if the service fails to shutdown
	 *
	 */
	shutdown() {
		this.logger?.info("Shutting down Retrospect AI services");

		// Clean up any resources that need explicit cleanup
		this.aiService = undefined;
		this.analysisManager = undefined;
		this.weeklyAnalysisService = undefined;
		this.journalAnalysisService = undefined;

		this.logger?.info("Services shutdown complete");
		this.logger = undefined;
	}

	/**
	 * Analyze content
	 * @param {string} content - The content to analyze
	 * @returns {Promise<void>} The analyzed content
	 * @throws {Error} if the analysis manager is not initialized
	 *
	 */
	async analyzeContent(content: string): Promise<void> {
		try {
			if (!this.analysisManager) {
				throw new Error("Analysis manager is not initialized");
			}
			await this.analysisManager.analyzeContent(
				content,
				this.plugin.settings.reflectionTemplate,
				this.plugin.settings.communicationStyle
			);
		} catch (error) {
			this.logger?.error("Error during content analysis:", error);
			throw new AnalysisError(
				error instanceof Error ? error.message : String(error)
			);
		}
	}
}
