export class ServiceInitializationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ServiceInitializationError';
    }
}

export class AIServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIServiceError';
    }
}

export class AnalysisError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AnalysisError';
    }
}

export class PrivacyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PrivacyError';
    }
} 