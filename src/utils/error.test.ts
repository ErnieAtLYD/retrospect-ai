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
});