import { AIService } from "./AIService";
import { AIServiceError } from "../utils/error";
import { retry, RetryOptions } from "../utils/retry";
import { fetchWithError } from "../utils/fetchWithError";

interface FetchResponse {
	response: string;
	// Add other properties if needed
}

interface RequestBody extends Record<string, unknown> {
	model: string;
	prompt: string;
	stream: boolean;
}

export class OllamaService implements AIService {
	private readonly retryOptions: RetryOptions = {
		maxAttempts: 3,
		delayMs: 1000,
		backoffFactor: 2,
	};

	constructor(private host: string, private model: string) {}

	async analyze(
		content: string,
		template: string,
		style: string
	): Promise<string> {
		return retry(async () => {
			try {
				const data = await fetchWithError<FetchResponse>({
					url: `${this.host}/api/generate`,
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: {
						model: this.model,
						prompt: `You are an insightful journaling assistant. Provide ${
							style === "direct"
								? "direct and honest"
								: "supportive and gentle"
						} feedback.\n\n${template}\n\nContent to analyze:\n${content}`,
						stream: false,
					} as RequestBody,
				});

				if (!data.response) {
					throw new AIServiceError(
						"No content in response",
						new Error("Empty response"),
						false
					);
				}
				return data.response;
			} catch (error) {
				if (error instanceof AIServiceError) {
					throw error;
				}

				// Change this check to match the actual error message format
				if (
					error instanceof Error &&
					error.message.includes("HTTP error! status: 500")
				) {
					throw new AIServiceError(
						"Ollama request failed: Internal Server Error",
						error,
						true
					);
				}

				throw new AIServiceError(
					"Failed to communicate with Ollama",
					error instanceof Error ? error : new Error(String(error)),
					true
				);
			}
		}, this.retryOptions);
	}
}
