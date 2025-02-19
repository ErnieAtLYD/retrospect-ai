// fetchWithError.ts

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
