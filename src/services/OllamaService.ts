import { AIService } from "./AIService";
import { AIServiceError } from "../utils/error";
import { retry, RetryOptions } from "../utils/retry";
import { fetchWithError } from "../utils/fetchWithError";
import { LoggingService } from "./LoggingService";

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
	private logger?: LoggingService;

	/**
	 * Constructs a new OllamaService instance.
	 * @param host - The host URL of the Ollama server.
	 * @param model - The model to use for the analysis.
	 * @param logger - Optional logger for debugging.
	 */
	constructor(private host: string, private model: string, logger?: LoggingService) {
		this.logger = logger;
		
		// Validate host URL format
		try {
			new URL(host);
		} catch (e) {
			const errorMsg = `Invalid Ollama host URL: ${host}`;
			this.logger?.error(errorMsg);
			throw new Error(errorMsg);
		}
	}

	/**
	 * Analyzes the content of a journal entry using Ollama.
	 * @param content - The content of the journal entry to analyze.
	 * @param template - The template to use for the analysis.
	 * @param style - The style of the analysis.
	 * @returns A promise that resolves to the analysis result.
	 */
	async analyze(
		content: string,
		template: string,
		style: string
	): Promise<string> {
		this.logger?.info(`Analyzing content with Ollama model: ${this.model}`);
		this.logger?.debug(`Using ${style} communication style`);
		
		return retry(async () => {
			try {
				this.logger?.debug(`Sending request to Ollama at ${this.host}/api/generate`);
				
				const prompt = `You are an insightful journaling assistant. Provide ${
					style === "direct"
						? "direct and honest"
						: "supportive and gentle"
				} feedback.\n\n${template}\n\nContent to analyze:\n${content}`;
				
				this.logger?.debug("Request prepared, sending to Ollama");
				
				const data = await fetchWithError<FetchResponse>({
					url: `${this.host}/api/generate`,
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: {
						model: this.model,
						prompt: prompt,
						stream: false,
					} as RequestBody,
				});

				if (!data.response) {
					const errorMsg = "No content in response";
					this.logger?.error(errorMsg);
					throw new AIServiceError(
						errorMsg,
						new Error("Empty response"),
						false
					);
				}
				
				this.logger?.info("Successfully received response from Ollama");
				this.logger?.debug(`Response length: ${data.response.length} characters`);
				
				return data.response;
			} catch (error) {
				if (error instanceof AIServiceError) {
					this.logger?.error(`AIServiceError: ${error.message}`, error.cause);
					throw error;
				}

				// Change this check to match the actual error message format
				if (
					error instanceof Error &&
					error.message.includes("HTTP error! status: 500")
				) {
					const errorMsg = "Ollama request failed: Internal Server Error";
					this.logger?.error(errorMsg, error);
					throw new AIServiceError(
						errorMsg,
						error,
						true
					);
				}

				const errorMsg = "Failed to communicate with Ollama";
				this.logger?.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
				throw new AIServiceError(
					errorMsg,
					error instanceof Error ? error : new Error(String(error)),
					true
				);
			}
		}, this.retryOptions);
	}
}
