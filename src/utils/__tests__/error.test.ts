import { AIServiceError, APIError } from '../error';

describe('AIServiceError', () => {
    it('should create an instance with a message and cause', () => {
        const cause = new APIError('API failed', 500);
        const error = new AIServiceError('AI Service failed', cause);

        expect(error.message).toBe('AI Service failed');
        expect(error.cause).toBe(cause);
        expect(error.retryable).toBe(true);
        expect(error.name).toBe('AIServiceError');
    });

    it('should default retryable to true', () => {
        const error = new AIServiceError('AI Service failed');
        expect(error.retryable).toBe(true);
    });

    it('should allow setting retryable to false', () => {
        const error = new AIServiceError('AI Service failed', undefined, false);
        expect(error.retryable).toBe(false);
    });
});
