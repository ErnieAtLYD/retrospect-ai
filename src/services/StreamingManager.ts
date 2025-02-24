import { Editor, EditorPosition } from "obsidian";

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

			// Stop the loading indicator before adding new content
			await this.stopLoadingIndicator();

			// Add header and stream content from the same starting position
			const startLine = this.analysisStartLine || 0;
			const headerAndContent = `## AI Reflection\n${fullResponse}`;
			
			// Stream the content
			await this.streamContent(
				headerAndContent,
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
    async streamContent(content: string, updateInterval = 50, startLine = 0): Promise<void> {
        if (!content) return;

        const lines = content.split('\n');
        const currentContent = this.editor.getValue();
        let newContent = currentContent;
        
        // Stream each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (i === 0 && startLine > 0) {
                // For first line when inserting after existing content
                newContent = currentContent + line;
            } else if (i === 0) {
                // For first line when starting fresh
                newContent = line;
            } else {
                // For subsequent lines
                newContent += '\n' + line;
            }
            
            this.editor.setValue(newContent);
            
            // Update cursor position
            const cursorLine = startLine + i;
            const cursorCh = line.length;
            this.editor.setCursor({ line: cursorLine, ch: cursorCh });
            
            if (i < lines.length - 1) { // Don't wait after the last line
                await new Promise(resolve => setTimeout(resolve, updateInterval));
            }
        }
    }

	/**
	 * 
	 * @param line 
	 * @param ch 
	 */
	private async setCursorSafely (line: number, ch: number): Promise<void> {
		try {
			const lineCount = this.editor.lineCount();
			if (line < lineCount) {
				const currentLineContent = this.editor.getLine(line) || '';
				this.editor.setCursor({
					line,
					ch: Math.min(ch, currentLineContent.length)
				});
			}
		} catch (e) {
			console.debug('Could not set cursor position', e);
		}
	}

	/**
	 * Replace the content of the editor with the given content.
	 * @param content - The content to replace the editor with.
	 */
	private async replaceContent(content: string): Promise<void> {
		if (!this.initialCursorPos || this.analysisStartLine === null) return;
		this.editor.setValue(content);
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

