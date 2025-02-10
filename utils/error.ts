export class APIError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = 'APIError';
    }
}

export function logError(error: Error): void {
    console.error(`[${new Date().toISOString()}] ${error.name}: ${error.message}`);
}
