import { AIService, isAIService } from '../services/AIService';

describe('AIService', () => {
    describe('isAIService', () => {
        it('should return true for valid AIService', () => {
            const validService: AIService = {
                analyze: async () => 'test'
            };
            expect(isAIService(validService)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isAIService(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isAIService(undefined)).toBe(false);
        });

        it('should return false for object without analyze method', () => {
            const invalidService = { foo: 'bar' };
            expect(isAIService(invalidService)).toBe(false);
        });

        it('should return false for object with analyze property that is not a function', () => {
            const invalidService = { analyze: 'not a function' };
            expect(isAIService(invalidService)).toBe(false);
        });
    });
});
