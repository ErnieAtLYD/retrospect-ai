import { RecapitanSettings } from "../types";

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export class LoggingService {
    private enabled: boolean;
    private level: LogLevel;

    constructor(
        private settings: RecapitanSettings,
        level: LogLevel = LogLevel.INFO,
        enabled: boolean = false
    ) {
        this.level = level;
        this.enabled = enabled;
    }

    /**
     * Set the log level
     * @param level The log level to set
     */
    setLevel(level: LogLevel): void {
        this.level = level;
    }

    /**
     * Enable or disable logging
     * @param enabled Whether logging should be enabled
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Log an error message
     * @param message The message to log
     * @param error Optional error object
     */
    error(message: string, error?: Error): void {
        if (this.enabled && this.level >= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`);
            if (error) {
                console.error(error);
            }
        }
    }

    /**
     * Log a warning message
     * @param message The message to log
     */
    warn(message: string): void {
        if (this.enabled && this.level >= LogLevel.WARN) {
            console.warn(`[WARN] ${message}`);
        }
    }

    /**
     * Log an info message
     * @param message The message to log
     */
    info(message: string): void {
        if (this.enabled && this.level >= LogLevel.INFO) {
            console.info(`[INFO] ${message}`);
        }
    }

    /**
     * Log a debug message
     * @param message The message to log
     */
    debug(message: string): void {
        if (this.enabled && this.level >= LogLevel.DEBUG) {
            console.debug(`[DEBUG] ${message}`);
        }
    }
}
