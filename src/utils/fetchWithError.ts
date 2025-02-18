import { AIServiceError } from './error';

interface FetchOptions {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
}

export async function fetchWithError<T>(options: FetchOptions): Promise<T> {
    try {
        const response = await fetch(options.url, {
            method: options.method || 'GET',
            headers: options.headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new AIServiceError('Unauthorized: Please check your API key.', undefined, false);
            } else if (response.status === 429) {
                throw new AIServiceError('Rate limit exceeded', undefined, true);
            } else if (response.status === 500) {
                throw new AIServiceError('Internal Server Error', undefined, true);
            }

            const errorMessage = `Request failed: ${response.statusText}`;
            throw new AIServiceError(errorMessage, undefined, response.status >= 500);
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        if (error instanceof AIServiceError) {
            throw error;
        }
        throw new AIServiceError('Failed to make network request', error as Error, true);
    }
}
