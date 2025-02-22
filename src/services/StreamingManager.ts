import { Editor, EditorPosition, App } from 'obsidian';

export class StreamingEditorManager {
    private editor: Editor;
    private app: App;
    private loadingIndicators: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    private currentLoadingFrame = 0;
    private loadingInterval: NodeJS.Timeout | null = null;
    private initialCursorPos: EditorPosition | null = null;
    private analysisStartLine: number | null = null;

    constructor(editor: Editor, app: App) {
        this.editor = editor;
        this.app = app;
    }

    async streamAnalysis(
        analysisPromise: Promise<string>,
        options: {
            streamingUpdateInterval?: number;
            loadingIndicatorPosition?: 'top' | 'bottom' | 'cursor';
            chunkSize?: number;
        } = {}
    ): Promise<void> {
        const {
            streamingUpdateInterval = 100,
            loadingIndicatorPosition = 'cursor',
            chunkSize = 50
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
            await this.streamContent(fullResponse, streamingUpdateInterval, chunkSize);

        } catch (error) {
            console.error('Error during streaming analysis:', error);
			await this.replaceContent(
				`\n\nError during analysis: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			await this.stopLoadingIndicator();
		}
	}

    private async streamContent(
        content: string,
        updateInterval: number,
        chunkSize: number
    ): Promise<void> {
        const chunks = this.chunkResponse(content, chunkSize);
        let currentContent = '';

        for (const chunk of chunks) {
            currentContent += chunk;
            await this.replaceContent(currentContent);
            await new Promise(resolve => setTimeout(resolve, updateInterval));
        }
    }

    private chunkResponse(response: string, chunkSize: number): string[] {
        const words = response.split(' ');
        const chunks: string[] = [];
        let currentChunk: string[] = [];
        let currentSize = 0;

        for (const word of words) {
            if (currentSize + word.length > chunkSize) {
                chunks.push(currentChunk.join(' ') + ' ');
                currentChunk = [word];
                currentSize = word.length;
            } else {
                currentChunk.push(word);
                currentSize += word.length + 1; // +1 for space
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
        }

        return chunks;
    }

    private async replaceContent(content: string): Promise<void> {
        if (!this.initialCursorPos || this.analysisStartLine === null) return;

        const startPosition = {
            line: this.analysisStartLine,
            ch: 0
        };

        // Find the end of the current content
        const currentText = this.editor.getValue();
        const lines = currentText.split('\n');
        const endPosition = {
            line: lines.length,
            ch: lines[lines.length - 1].length
        };

        // Replace the entire analysis section
        this.editor.replaceRange(content, startPosition, endPosition);
    }

    private async startLoadingIndicator(position: 'top' | 'bottom' | 'cursor'): Promise<void> {
        let insertLine: number;
    
        switch (position) {
            case 'top':
                insertLine = 0;
                break;
            case 'bottom':
                insertLine = this.editor.lineCount();
                break;
            case 'cursor':
            default:
                insertLine = this.initialCursorPos?.line ?? 0;
                break;
        }
    
        this.analysisStartLine = insertLine;
    
        // Insert initial loading indicator
        const initialLoadingText = `\n${this.loadingIndicators[0]} Analyzing...`;
        this.editor.replaceRange(initialLoadingText, { line: insertLine, ch: 0 });
    
        // Start animation, but only update the spinner character
        this.loadingInterval = setInterval(() => {
            if (this.analysisStartLine === null) return;
            
            this.currentLoadingFrame = (this.currentLoadingFrame + 1) % this.loadingIndicators.length;
            const indicator = this.loadingIndicators[this.currentLoadingFrame];
            
            // Only replace the spinner character, not the whole text
            this.editor.replaceRange(
                indicator,
                { line: this.analysisStartLine, ch: 1 },  // Skip the newline
                { line: this.analysisStartLine, ch: 2 }   // Only replace one character
            );
        }, 100);
    }

    private async stopLoadingIndicator(): Promise<void> {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }

        if (this.analysisStartLine !== null) {
            this.editor.replaceRange(
                '',
                { line: this.analysisStartLine, ch: 0 },
                { line: this.analysisStartLine + 1, ch: 0 }
            );
        }
    }
}