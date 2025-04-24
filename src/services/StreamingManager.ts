import { Editor, EditorPosition } from "obsidian";
import { StreamingAnalysisOptions, LoadingIndicatorPosition } from "types";
import { debounce } from "../utils/debounce";

/**
 * Manages the streaming of content to the editor.
 */
export class StreamingEditorManager {
	private editor: Editor;
	private loadingIndicators: string[] = [
		"⠋",
		"⠙",
		"⠹",
		"⠸",
		"⠼",
		"⠴",
		"⠦",
		"⠧",
		"⠇",
		"⠏",
	];
	private currentLoadingFrame = 0;
	private loadingInterval: NodeJS.Timeout | null = null;
	private initialCursorPos: EditorPosition | null = null;
	private analysisStartLine: number | null = null;
	private debouncedSetValue: (content: string) => void;

	constructor(editor: Editor) {
		this.editor = editor;
		// Create a debounced version of setValue with a 100ms delay
		this.debouncedSetValue = debounce((content: string) => {
			this.editor.setValue(content);
		}, 100);
	}

	/**
	 * Stream the analysis result to the editor.
	 * @param analysisPromise - The promise that resolves when analysis is complete.
	 * @param options - The options for the streaming analysis.
	 */
	async streamAnalysis(
		analysisPromise: Promise<void>,
		options: StreamingAnalysisOptions = {}
	): Promise<void> {
		const {
			streamingUpdateInterval = 100,
			loadingIndicatorPosition = "cursor",
		} = options;

		try {
			this.initialCursorPos = this.editor.getCursor();

			// Start with the loading indicator
			await this.startLoadingIndicator(loadingIndicatorPosition);

			// Wait for analysis to complete
			await analysisPromise;

			// Stop the loading indicator
			await this.stopLoadingIndicator();

			// Add completion message
			const startLine = this.analysisStartLine || 0;
			const completionMessage = "## AI Reflection\nAnalysis complete. Check the side panel for results.";

			// Stream the completion message
			await this.streamContent(
				completionMessage,
				streamingUpdateInterval,
				startLine
			);
		} catch (error) {
			console.error("Error during streaming analysis:", error);
			await this.replaceContent(
				`\nError during analysis: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			// Ensure loading indicator is cleaned up in case of errors
			if (this.loadingInterval) {
				await this.stopLoadingIndicator();
			}
		}
	}

	/**
	 * Stream the content of the response to the editor.
	 * @param content - The content to stream.
	 * @param updateInterval - The interval to update the content.
	 * @param startLine - The line to start the content.
	 */
	async streamContent(
		content: string,
		updateInterval = 50,
		startLine = 0
	): Promise<void> {
		if (!content) {
			return;
		}

		const lines = content.split("\n");
		let currentLine = startLine;

		// Get current content
		const currentContent = this.editor.getValue();
		const currentLines = currentContent.split("\n");

		// Stream each line
		for (const line of lines) {
			// Ensure we have enough lines by adding empty lines if needed
			while (currentLines.length <= currentLine) {
				currentLines.push("");
			}

			// Update the line
			currentLines[currentLine] = line;

			// Set the content
			const newContent = currentLines.join("\n").trimEnd();
			this.debouncedSetValue(newContent);

			// Try to set cursor position safely
			this.setCursorSafely(currentLine, line.length);

			await new Promise((resolve) => setTimeout(resolve, updateInterval));
			currentLine++;
		}
	}

	/**
	 * Set the cursor safely.
	 * @param line - The line to set the cursor to.
	 * @param ch - The character to set the cursor to.
	 */
	private async setCursorSafely(line: number, ch: number): Promise<void> {
		try {
			const lineCount = this.editor.lineCount();
			if (line < lineCount) {
				const currentLineContent = this.editor.getLine(line) || "";
				this.editor.setCursor({
					line,
					ch: Math.min(ch, currentLineContent.length),
				});
			}
		} catch (e) {
			console.debug("Could not set cursor position", e);
		}
	}

	/**
	 * Replace the content of the editor with the given content.
	 * @param content - The content to replace the editor with.
	 */
	private async replaceContent(content: string): Promise<void> {
		if (!this.initialCursorPos || this.analysisStartLine === null) return;

		const startPosition = {
			line: this.analysisStartLine,
			ch: 0,
		};

		// Find the end of the current content
		const currentText = this.editor.getValue();
		const lines = currentText.split("\n");
		const endPosition = {
			line: lines.length,
			ch: lines[lines.length - 1].length,
		};

		// Replace the entire analysis section
		this.editor.replaceRange(content, startPosition, endPosition);
	}

	/**
	 * Start the loading indicator at the specified position.
	 * @param position - The position to start the loading indicator.
	 */
	private async startLoadingIndicator(
		position: LoadingIndicatorPosition
	): Promise<void> {
		let insertLine: number;

		switch (position) {
			case "top":
				insertLine = 0;
				break;
			case "bottom":
				insertLine = this.editor.lineCount();
				break;
			case "cursor":
			default:
				insertLine = this.initialCursorPos?.line ?? 0;
				break;
		}

		this.analysisStartLine = insertLine;

		// Insert initial loading indicator
		const initialLoadingText = `\n${this.loadingIndicators[0]} Analyzing...`;
		this.editor.replaceRange(initialLoadingText, {
			line: insertLine,
			ch: 0,
		});

		// Start animation, but only update the spinner character
		this.loadingInterval = setInterval(() => {
			if (this.analysisStartLine === null) return;

			this.currentLoadingFrame =
				(this.currentLoadingFrame + 1) % this.loadingIndicators.length;
			const indicator = this.loadingIndicators[this.currentLoadingFrame];

			// Only replace the spinner character, not the whole text
			this.editor.replaceRange(
				indicator,
				{ line: this.analysisStartLine, ch: 1 }, // Skip the newline
				{ line: this.analysisStartLine, ch: 2 } // Only replace one character
			);
		}, 100);
	}

	/**
	 * Stop the loading indicator.
	 */
	private async stopLoadingIndicator(): Promise<void> {
		if (this.loadingInterval) {
			clearInterval(this.loadingInterval);
			this.loadingInterval = null;
		}

		if (this.analysisStartLine !== null) {
			this.editor.replaceRange(
				"",
				{ line: this.analysisStartLine, ch: 0 },
				{ line: this.analysisStartLine + 1, ch: 0 }
			);
		}
	}
}
