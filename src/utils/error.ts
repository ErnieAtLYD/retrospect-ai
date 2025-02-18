export class APIError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = 'APIError';
    }
}

export class AIServiceError<T extends Error = Error> extends Error {
    constructor(
        message: string,
        public readonly cause?: T,
        public readonly retryable: boolean = true
    ) {
        super(message);
        this.name = 'AIServiceError';
    }
}

export function logError(error: Error): void {
    console.error(`[${new Date().toISOString()}] ${error.name}: ${error.message}`);
    if (error instanceof AIServiceError && error.cause) {
        console.error('Caused by:', error.cause);
    }
}
