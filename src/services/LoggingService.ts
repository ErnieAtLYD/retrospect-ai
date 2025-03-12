import { RecapitanSettings } from "../types";

/**
 * Log levels for the logging service
 */
export enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}

/**
 * Service for logging messages at different levels
 */
export class LoggingService {
    private enabled: boolean;
    private level: LogLevel;

    /**
     * Creates a new LoggingService
     * @param settings - The plugin settings
     * @param level - The log level (default: INFO)
     * @param enabled - Whether logging is enabled (default: false)
     */
    constructor(
        private settings: RecapitanSettings,
        level: LogLevel = LogLevel.INFO,
        enabled: boolean = false
    ) {
        this.level = level;
        this.enabled = enabled || settings.loggingEnabled || false;
    }

    /**
     * Set whether logging is enabled
     * @param enabled - Whether to enable logging
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Set the log level
     * @param level - The log level
     */
    setLevel(level: LogLevel): void {
        this.level = level;
    }

    /**
     * Log an error message
     * @param message - The message to log
     * @param error - Optional error object
     */
    error(message: string, error?: Error | unknown): void {
        if (!this.enabled || this.level < LogLevel.ERROR) {
        
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] ${message}`, error);
        
        // Log stack trace if error object is provided
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
    }

    /**
     * Log a warning message
     * @param message - The message to log
     * @param data - Optional additional data
     */
    warn(message: string, data?: unknown): void {
        if (!this.enabled || this.level < LogLevel.WARN) {
        
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] ${message}`, data);
    }

    /**
     * Log an info message
     * @param message - The message to log
     * @param data - Optional additional data
     */
    info(message: string, data?: unknown): void {
        if (!this.enabled || this.level < LogLevel.INFO) {
        
        const timestamp = new Date().toISOString();
        console.info(`[${timestamp}] [INFO] ${message}`, data);
    }

    /**
     * Log a debug message
     * @param message - The message to log
     * @param data - Optional additional data
     */
    debug(message: string, data?: unknown): void {
        if (!this.enabled || this.level < LogLevel.DEBUG) {
        
        const timestamp = new Date().toISOString();
        console.debug(`[${timestamp}] [DEBUG] ${message}`, data);
    }
}
