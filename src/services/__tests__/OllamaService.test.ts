import { OllamaService } from "../OllamaService";
import { retry } from "../../utils/retry";

// Mock the retry utility
jest.mock("../../utils/retry");
const mockRetry = retry as jest.MockedFunction<typeof retry>;

describe("OllamaService", () => {
	let ollamaService: OllamaService;
	const mockHost = "http://localhost:11434";
	const mockModel = "llama2";

	beforeEach(() => {
		ollamaService = new OllamaService(mockHost, mockModel);
		mockRetry.mockImplementation((fn, options) => fn());
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe("analyze", () => {
		it("should successfully analyze content with direct style", async () => {
			const mockResponse = { response: "Analysis result" };
			global.fetch = jest.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await ollamaService.analyze(
				"Test content",
				"Test template",
				"direct"
			);

			const expectedBody = {
				model: mockModel,
				prompt: "You are an insightful journaling assistant. Provide direct and honest feedback.\n\nTest template\n\nContent to analyze:\nTest content",
				stream: false
			};

			expect(result).toBe("Analysis result");
			expect(global.fetch).toHaveBeenCalledWith(
				`${mockHost}/api/generate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(expectedBody)
				}
			);
		});

		it("should successfully analyze content with gentle style", async () => {
			const mockResponse = { response: "Gentle analysis" };
			global.fetch = jest.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await ollamaService.analyze(
				"Test content",
				"Test template",
				"gentle"
			);

			const requestBody = JSON.parse(
				(global.fetch as jest.Mock).mock.calls[0][1].body
			);
			expect(requestBody.prompt).toContain("supportive and gentle");
		});

		it("should throw AIServiceError with retryable=true on network error", async () => {
			global.fetch = jest
				.fn()
				.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				ollamaService.analyze("Test content", "Test template", "direct")
).rejects.toMatchObject({
        name: "AIServiceError",
        message: "Failed to communicate with Ollama",
        isRetryable: true,
});
		});

		it("should throw AIServiceError with retryable=true on server error", async () => {
			global.fetch = jest.fn().mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			await expect(
				ollamaService.analyze("Test content", "Test template", "direct")
).rejects.toMatchObject({
        name: "AIServiceError",
        message: "Ollama request failed: Internal Server Error",
        isRetryable: true,
});
		});

		it("should throw AIServiceError with retryable=false on empty response", async () => {
			global.fetch = jest.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({}),
			});

			await expect(
				ollamaService.analyze("Test content", "Test template", "direct")
).rejects.toMatchObject({
        name: "AIServiceError",
        message: "No content in response",
        isRetryable: false,
});
		});

		it("should use retry utility with correct options", async () => {
			const mockResponse = { response: "Analysis result" };
			global.fetch = jest.fn().mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			await ollamaService.analyze(
				"Test content",
				"Test template",
				"direct"
			);

			expect(mockRetry).toHaveBeenCalledWith(expect.any(Function), {
				maxAttempts: 3,
				delayMs: 1000,
				backoffFactor: 2,
			});
		});
	});
});
