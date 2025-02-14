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

// Define a function to identify transient errors
function isTransientError(error: Error): boolean {
    // Example logic: check error message or code
    // This should be customized based on your application's error handling
    const transientErrorMessages = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];
    return transientErrorMessages.some(msg => error.message.includes(msg));
}

export async function retry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const finalOptions: RetryOptions = { ...defaultRetryOptions, ...options };
    let lastError: Error | null = null;
    let delay = finalOptions.delayMs;

    for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Use a type guard to check for nonRetryable property
            if ((error as { nonRetryable?: boolean }).nonRetryable) {
                throw lastError;
            }

            // Check if the error is transient
            if (!isTransientError(lastError) || attempt === finalOptions.maxAttempts) {
                break;
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= finalOptions.backoffFactor;
        }
    }

    if (lastError) {
        throw lastError;
    } else {
        throw new Error('Operation failed without an error being caught.');
    }
}
