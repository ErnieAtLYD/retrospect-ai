import { Editor, EditorPosition, App } from "obsidian";

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

	constructor(editor: Editor) {
		this.editor = editor;
	}

	/**
	 * Stream the analysis result to the editor.
	 * @param analysisPromise - The promise that resolves to the analysis result.
	 * @param options - The options for the streaming analysis.
	 */
	async streamAnalysis(
		analysisPromise: Promise<string>,
		options: {
			streamingUpdateInterval?: number;
			loadingIndicatorPosition?: "top" | "bottom" | "cursor";
			chunkSize?: number;
		} = {}
	): Promise<void> {
		const {
			streamingUpdateInterval = 100,
			loadingIndicatorPosition = "cursor",
			chunkSize = 50,
		} = options;

		try {
			this.initialCursorPos = this.editor.getCursor();

			// Start with the loading indicator
			await this.startLoadingIndicator(loadingIndicatorPosition);

			// Get the analysis result
			const fullResponse = await analysisPromise;

			// Initial header setup
			await this.replaceContent("\n\n## AI Reflection\n");

			// Stream the content
			await this.streamContent(
				fullResponse,
				streamingUpdateInterval,
				chunkSize
			);
		} catch (error) {
			console.error("Error during streaming analysis:", error);
			await this.replaceContent(
				`\n\nError during analysis: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			await this.stopLoadingIndicator();
		}
	}

	/**
	 * Stream the content of the response to the editor.
	 * @param content - The content to stream.
	 * @param updateInterval - The interval to update the content.
	 * @param startLine - The line to start the content.
	 */
    async streamContent(content: string, updateInterval = 50, startLine = 0): Promise<void> {
        if (!content) return;

        const lines = content.split('\n');
        let currentLine = startLine;
        
        // Get current content
        const currentContent = this.editor.getValue();
        const currentLines = currentContent.split('\n');
        
        // Stream each line
        for (const line of lines) {
            // Ensure we have enough lines by adding empty lines if needed
            while (currentLines.length <= currentLine) {
                currentLines.push('');
            }
            
            // Update the line
            currentLines[currentLine] = line;
            
            // Set the content
            const newContent = currentLines.join('\n').trimEnd();
            this.editor.setValue(newContent);
            
            // Try to set cursor position safely
            try {
                const lineCount = this.editor.lineCount();
                if (currentLine < lineCount) {
                    const currentLineContent = this.editor.getLine(currentLine) || '';
                    this.editor.setCursor({
                        line: currentLine,
                        ch: Math.min(line.length, currentLineContent.length)
                    });
                }
            } catch (e) {
                // If cursor setting fails, don't throw
                console.debug('Could not set cursor position', e);
            }
            
            await new Promise(resolve => setTimeout(resolve, updateInterval));
            currentLine++;
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
		position: "top" | "bottom" | "cursor"
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

