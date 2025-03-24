import { AIService } from "./AIService";
import { LoggingService } from "./LoggingService";

/**
 * AnthropicService implements the AIService interface for Anthropic's Claude API
 */
export class AnthropicService implements AIService {
    private apiKey: string;
    private model: string;
    private logger?: LoggingService;
    private baseUrl = "https://api.anthropic.com/v1/messages";

    constructor(apiKey: string, model: string, logger?: LoggingService) {
        this.apiKey = apiKey;
        this.model = model;
        this.logger = logger;
    }

    /**
     * Sends a prompt to the Anthropic API and returns the response
     * @param prompt The prompt to send to the API
     * @returns The response from the API
     */
    async generateText(prompt: string): Promise<string> {
        try {
            this.logger?.debug(`Sending request to Anthropic API with model: ${this.model}`);
            
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 4000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Anthropic API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            
            if (!data.content || !data.content[0] || !data.content[0].text) {
                throw new Error("Unexpected response format from Anthropic API");
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
    async streamText(prompt: string, callback: (text: string) => void): Promise<void> {
        try {
            this.logger?.debug(`Streaming request to Anthropic API with model: ${this.model}`);
            
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 4000,
                    stream: true
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
            }

            if (!response.body) {
                throw new Error("Response body is null");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let isDone = false;

            while (!isDone) {
                const { done, value } = await reader.read();
                isDone = done;
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Process each line in the buffer
                while (buffer.includes("\n")) {
                    const lineEnd = buffer.indexOf("\n");
                    const line = buffer.substring(0, lineEnd).trim();
                    buffer = buffer.substring(lineEnd + 1);
                    
                    if (line.startsWith("data: ")) {
                        const data = line.substring(6);
                        if (data === "[DONE]") continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === "content_block_delta" && 
                                parsed.delta && 
                                parsed.delta.text) {
                                callback(parsed.delta.text);
                            }
                        } catch (e) {
                            this.logger?.error("Error parsing SSE data", e);
                        }
                    }
                }
            }
        } catch (error) {
            this.logger?.error("Error in Anthropic streaming API request", error);
            throw error;
        }
    }

    async analyze(content: string, template: string, style: string): Promise<string> {
        const prompt = `${template}\n\nContent to analyze:\n${content}\n\nStyle: ${style}`;
        return this.generateText(prompt);
    }
}
