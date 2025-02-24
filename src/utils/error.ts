/**
 * API error.
 */
export class APIError extends Error {
	constructor(message: string, public status: number) {
		super(message);
		this.name = "APIError";
	}
}

/**
 * AI service error.
 */
export class AIServiceError<T extends Error> extends Error {
    public readonly isRetryable: boolean;
    public readonly cause?: T;

    constructor(message: string, cause?: T, retryable = true) {
        super(message);
        this.name = 'AIServiceError';
        this.isRetryable = retryable;
        this.cause = cause;
        Error.captureStackTrace(this, AIServiceError);
    }
}

/**
 * Logs an error to the console.
 * @param error - The error to log.
 */
export function logError(error: Error): void {
	console.error(
		`[${new Date().toISOString()}] ${error.name}: ${error.message}`
	);
	if (error instanceof AIServiceError && error.cause) {
		console.error("Caused by:", error.cause);
	}
}
