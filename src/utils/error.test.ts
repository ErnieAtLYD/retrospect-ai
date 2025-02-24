// src/utils/error.test.ts
import { AIServiceError, APIError } from './error';

describe('Error Types', () => {
    test('AIServiceError should have correct name and message', () => {
        const error = new AIServiceError('AI service failed');
        expect(error.name).toBe('AIServiceError');
        expect(error.message).toBe('AI service failed');
    });

    test('APIError should have correct name, message and status', () => {
        const error = new APIError('API request failed', 404);
        expect(error.name).toBe('APIError');
        expect(error.message).toBe('API request failed');
        expect(error.status).toBe(404);
    });

    it('should create an instance with a message and cause', () => {
        const cause = new APIError('API failed', 500);
        const error = new AIServiceError('AI Service failed', cause);

        expect(error.message).toBe('AI Service failed');
        expect(error.cause).toBe(cause);
        expect(error.isRetryable).toBe(true);
        expect(error.name).toBe('AIServiceError');
    });

    it('should default retryable to true', () => {
        const error = new AIServiceError('AI Service failed');
        expect(error.isRetryable).toBe(true);
    });

    it('should allow setting retryable to false', () => {
        const error = new AIServiceError('AI Service failed', undefined, false);
        expect(error.isRetryable).toBe(false);
    });
});