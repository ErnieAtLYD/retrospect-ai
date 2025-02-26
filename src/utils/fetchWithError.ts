/**
 * Fetches data from a URL with error handling.
 * @param options - The fetch options.
 * @param options.url - The URL to fetch from.
 * @param options.method - The HTTP method to use.
 * @param options.headers - The headers to send with the request.
 * @param options.body - The body to send with the request.
 * @returns The parsed JSON response.
 */
export async function fetchWithError<T>(options: {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: Record<string, unknown>;
}): Promise<T> {
	const response = await fetch(options.url, {
		method: options.method,
		headers: options.headers,
		body: JSON.stringify(options.body),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return response.json() as Promise<T>;
}
