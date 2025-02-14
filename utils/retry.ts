export interface RetryOptions {
    maxAttempts: number;
    delayMs: number;
    backoffFactor: number;
}

export const defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffFactor: 2
};

export async function retry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const finalOptions: RetryOptions = { ...defaultRetryOptions, ...options };
    let lastError: Error;
    let delay = finalOptions.delayMs;

    for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt === finalOptions.maxAttempts) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= finalOptions.backoffFactor;
        }
    }

    throw lastError;
}
