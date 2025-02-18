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
                throw new AIServiceError<Response>('Unauthorized: Please check your API key.', response, false);
            } else if (response.status === 429) {
                throw new AIServiceError<Response>('Rate limit exceeded', response, true);
            } else if (response.status === 500) {
                throw new AIServiceError<Response>('Internal Server Error', response, true);
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
        throw error;
    }
}
