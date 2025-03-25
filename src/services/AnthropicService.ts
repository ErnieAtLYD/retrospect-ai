import { AIService } from "./AIService";
import { AIServiceError } from "../utils/error";
import { RetryOptions, retry } from "../utils/retry";
import { LoggingService } from "./LoggingService";
import { request as obsidianRequest } from "obsidian";

interface AnthropicResponse {
	content: Array<{
		type: string;
		text: string;
	}>;
}

// Allow request function to be overridden for testing
let request = obsidianRequest;

export function setRequestFunction(newRequest: typeof obsidianRequest) {
	request = newRequest;
}

/**
 * AnthropicService implements the AIService interface for Anthropic's Claude API
 */
export class AnthropicService implements AIService {
	private readonly retryOptions: RetryOptions = {
		maxAttempts: 3,
		delayMs: 1000,
		backoffFactor: 2,
	};
	private baseUrl = "https://api.anthropic.com/v1/messages";

	constructor(
		private apiKey: string,
		private model: string,
		private logger?: LoggingService
	) {
		if (!apiKey) {
			const errorMsg = "Anthropic API key is required";
			this.logger?.error(errorMsg);
			throw new Error(errorMsg);
		}

		if (!model) {
			const errorMsg = "Anthropic model name is required";
			this.logger?.error(errorMsg);
			throw new Error(errorMsg);
		}
	}

	/**
	 * Implements the AIService interface analyze method
	 * @param content The content to analyze
	 * @param template The template to use for the analysis
	 * @param style The style to use for the analysis
	 * @returns The analysis result
	 */
	async analyze(
		content: string,
		template: string,
		style: string
	): Promise<string> {
		this.logger?.debug("Analyzing content with Anthropic", {
			contentLength: content.length,
			model: this.model,
		});

		const prompt = this.formatPrompt(content, template, style);

		try {
			return await retry(async () => {
				return await this.generateText(prompt);
			}, this.retryOptions);
		} catch (error) {
			const errorMsg = `Anthropic API error: ${
				error instanceof Error ? error.message : String(error)
			}`;
			this.logger?.error(errorMsg, error);
			throw new AIServiceError(
				errorMsg,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Formats the prompt using the template and style
	 * @param content The content to analyze
	 * @param template The template to use
	 * @param style The style to use
	 * @returns The formatted prompt
	 */
	private formatPrompt(
		content: string,
		template: string,
		style: string
	): string {
		// Replace placeholders in the template
		return template.replace("{content}", content).replace("{style}", style);
	}

	/**
	 * Sends a prompt to the Anthropic API and returns the response
	 * @param prompt The prompt to send to the API
	 * @returns The response from the API
	 */
	async generateText(prompt: string): Promise<string> {
		try {
			this.logger?.debug(
				`Sending request to Anthropic API with model: ${this.model}`
			);

			const response = await request({
				url: this.baseUrl,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.apiKey,
					"anthropic-version": "2023-06-01",
				},
				body: JSON.stringify({
					model: this.model,
					messages: [{ role: "user", content: prompt }],
					max_tokens: 4000,
				}),
			});

			const data = JSON.parse(response) as AnthropicResponse;

			if (!data.content || !data.content[0] || !data.content[0].text) {
				throw new Error(
					"Unexpected response format from Anthropic API"
				);
			}

			return data.content[0].text;
		} catch (error) {
			this.logger?.error("Error in Anthropic API request", error);
			throw error;
		}
	}

	/**
	 * Streams a response from the Anthropic API
	 * @param prompt The prompt to send to the API
	 * @param callback The callback to call with each chunk of the response
	 */
	async streamText(
		prompt: string,
		callback: (text: string) => void
	): Promise<void> {
		try {
			this.logger?.debug(
				`Streaming request to Anthropic API with model: ${this.model}`
			);

			const response = await request({
				url: this.baseUrl,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.apiKey,
					"anthropic-version": "2023-06-01",
				},
				body: JSON.stringify({
					model: this.model,
					messages: [{ role: "user", content: prompt }],
					max_tokens: 4000,
					stream: true,
				}),
			});

			const lines = response.split("\n");
			for (const line of lines) {
				if (line.startsWith("data: ")) {
					const data = line.substring(6);
					if (data === "[DONE]") continue;

					try {
						const parsed = JSON.parse(data);
						if (
							parsed.type === "content_block_delta" &&
							parsed.delta &&
							parsed.delta.text
						) {
							callback(parsed.delta.text);
						}
					} catch (e) {
						this.logger?.error("Error parsing SSE data", e);
					}
				}
			}
		} catch (error) {
			this.logger?.error(
				"Error in Anthropic streaming API request",
				error
			);
			throw error;
		}
	}
}
