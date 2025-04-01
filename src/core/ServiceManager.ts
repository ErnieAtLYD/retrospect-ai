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
        this.initializeServices();
        
        // Create a debounced version of service initialization
        this.reinitializeServices = debounce(() => {
            this.initializeServices();
        }, 500);
    }

    reinitializeServices = () => {
        // This will be replaced with the debounced version in the constructor
        this.initializeServices();
    };

    initializeServices() {
        // Initialize logger first so other services can use it
        const logLevel = this.getLogLevel(this.plugin.settings.logLevel);
        this.logger = new LoggingService(
            this.plugin.settings,
            logLevel,
            this.plugin.settings.loggingEnabled
        );
        
        this.logger.info("Initializing Retrospect AI services");
        this.logger.debug(`Current AI provider: ${this.plugin.settings.aiProvider}`);
        
        this.privacyManager = new PrivacyManager(this.plugin.settings.privateMarker);

        // Clear existing service before creating a new one
        this.aiService = undefined;

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
                this.logger.debug("Initializing Ollama service with host: " + this.plugin.settings.ollamaHost);
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

        // Initialize analysis manager
        this.analysisManager = new AnalysisManager(
            this.aiService,
            this.privacyManager,
            this.plugin.settings.cacheTTLMinutes
        );

        // Initialize weekly analysis service
        this.weeklyAnalysisService = new WeeklyAnalysisService(
            this.plugin.settings,
            this.plugin.app,
            this.privacyManager,
            this.aiService,
            this.logger
        );

        // Initialize journal analysis service
        this.journalAnalysisService = new JournalAnalysisService(
            this.plugin.app,
            this.plugin.settings,
            this.analysisManager,
            this.logger
        );

        this.logger.info("Services initialized successfully");
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
