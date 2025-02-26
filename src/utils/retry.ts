import { AIServiceError } from './error'; // Adjust the path as necessary

// Define retry options
export interface RetryOptions {
    maxAttempts: number;
    delayMs: number;
    backoffFactor: number;
}

// Define default retry options
export const defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffFactor: 2
};

/**
 * Checks if an error is transient.
 * @param error - The error to check.
 * @returns True if the error is transient, false otherwise.
 */
function isTransientError(error: Error): boolean {
    // Example logic: check error message or code
    // This should be customized based on your application's error handling
    const transientErrorMessages = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];
    return transientErrorMessages.some(msg => error.message.includes(msg));
}

/**
 * Retry an async operation with exponential backoff.
 * @param operation - The async operation to retry.
 * @param options - The retry options.
 * @returns The result of the operation.
 */
export async function retry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const finalOptions: RetryOptions = { ...defaultRetryOptions, ...options };
    let lastError: Error | null = null;
    let delay = finalOptions.delayMs;

    // Retry the operation up to maxAttempts times
    for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Check for AIServiceError and respect its retryable flag
            if (error instanceof AIServiceError && !error.isRetryable) {
                throw error;
            }

            if ((error as { nonRetryable?: boolean }).nonRetryable) {
                throw lastError;
            }

            if (!isTransientError(lastError) || attempt === finalOptions.maxAttempts) {
                break;
            }

            // Wait for the delay before the next attempt
            await new Promise(resolve => setTimeout(resolve, delay));

            // Increase the delay for the next attempt
            delay *= finalOptions.backoffFactor;
        }
    }

    if (lastError) {
        throw lastError;
    } else {
        throw new Error('Operation failed without an error being caught.');
    }
}
