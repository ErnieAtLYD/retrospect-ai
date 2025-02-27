import { retry, RetryOptions } from './retry';
import { AIServiceError } from './error';

describe('retry utility', () => {
    // Mock console.log to avoid cluttering test output
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should retry a failing operation and eventually succeed', async () => {
        // Setup a mock function that fails twice then succeeds
        const mockOperation = jest.fn();
        let attempts = 0;
        
        mockOperation.mockImplementation(() => {
            attempts++;
            if (attempts <= 2) {
                throw new Error('ETIMEDOUT');
            }
            return Promise.resolve('success');
        });

        const options: RetryOptions = {
            maxAttempts: 3,
            delayMs: 10, // Use small delay for faster tests
            backoffFactor: 1.5
        };

        const result = await retry(mockOperation, options);
        
        expect(result).toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    test('should not retry when AIServiceError is marked as not retryable', async () => {
        const mockOperation = jest.fn().mockImplementation(() => {
            throw new AIServiceError('Non-retryable error', undefined, false);
        });

        await expect(retry(mockOperation)).rejects.toThrow('Non-retryable error');
        expect(mockOperation).toHaveBeenCalledTimes(1);
    });
});
