import { App, Editor, MarkdownView, Notice, TFile } from "obsidian";
import { AnalysisManager } from "./AnalysisManager";
import { LoggingService } from "./LoggingService";
import { RetrospectAISettings } from "../types";
import { ReflectionMemoryManager } from "./ReflectionMemoryManager";
import { StreamingEditorManager } from "./StreamingManager";

export class JournalAnalysisService {
    constructor(
        private app: App,
        private settings: RetrospectAISettings,
        private analysisManager: AnalysisManager,
        private logger: LoggingService,
        private reflectionMemoryManager: ReflectionMemoryManager
    ) {}

    async analyzeDailyJournal(): Promise<void> {
        try {
            const formattedDate = this.getTodayFormattedDate();
            this.logger.debug(`Starting daily journal analysis for date: ${formattedDate}`);

            const dailyNote = await this.findDailyNote(formattedDate);
            if (!dailyNote) {
                this.handleNoJournalFound(formattedDate);
                return;
            }

            const view = await this.openDailyNote(dailyNote);
            if (!view) {
                this.handleNoEditorView();
                return;
            }

            await this.performAnalysis(view.editor, dailyNote);
        } catch (error) {
            this.handleAnalysisError(error);
        }
    }

    /**
     * Analyzes the content.
     * @param content
     * @param noteId
     * @param noteName
     * @returns Promise<string> The analysis result
     */
    async analyzeContent(content: string, noteId?: string, noteName?: string): Promise<string> {
        try {
            const result = await this.analysisManager.analyzeContent(
                content,
                this.settings.reflectionTemplate,
                this.settings.communicationStyle,
                noteId,
                noteName
            );
            
            // Return the analysis content
            return result;
        } catch (error) {
            console.error("Error during content analysis:", error);
            throw error; // Let the streaming manager handle the error
        }
    }

    /**
     * Gets today's date in YYYY-MM-DD format
     */
    private getTodayFormattedDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Find the daily note
     * @param date
     * @returns
     */
    private async findDailyNote(date: string): Promise<TFile | null> {
        const files = this.app.vault.getMarkdownFiles();
        return files.find(file => file.path.includes(date)) || null;
    }

    /**
     * Open the daily note
     * @param note
     * @returns
     */
    private async openDailyNote(note: TFile): Promise<MarkdownView | null> {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(note);
        return this.app.workspace.getActiveViewOfType(MarkdownView);
    }

    /**
     * Get the note content
     * @param note
     * @returns
     */
    private async getNoteContent(note: TFile): Promise<string> {
        return await this.app.vault.read(note);
    }

    /**
     * Handle no journal found
     * @param date
     */
    private handleNoJournalFound(date: string): void {
        const message = `No journal entry found for today (${date})`;
        this.logger.warn(message);
        new Notice("No journal entry found for today");
    }

    /**
     * Handle no editor view
     */
    private handleNoEditorView(): void {
        const message = "Could not get editor view";
        this.logger.error(message);
        new Notice(message);
    }

    /**
     * Perform the analysis
     * @param editor
     * @param note
     * @returns Promise<void>
     */
    private async performAnalysis(editor: Editor, note: TFile): Promise<void> {
        const streamingManager = new StreamingEditorManager(editor);
        new Notice("Analyzing today's journal entry...");

        try {
            const content = await this.getNoteContent(note);
            
            // Start the analysis process and wait for the result
            const analysisResult = await streamingManager.streamAnalysis(
                this.analyzeContent(content, note.path, note.basename),
                {
                    loadingIndicatorPosition: "bottom",
                    streamingUpdateInterval: 50,
                }
            );
            
            // Store the reflection in the reflection memory manager
            try {
                this.logger.debug("Storing reflection in memory manager", {
                    notePath: note.path,
                    noteBasename: note.basename
                });
                
                // Extract tags from the note content
                const tags = this.extractTags(content);
                
                // Extract keywords from the analysis result
                const keywords = this.extractKeywords(analysisResult);
                
                // Store the reflection
                await this.reflectionMemoryManager.addReflection({
                    date: this.getTodayFormattedDate(),
                    sourceNotePath: note.path,
                    reflectionText: analysisResult,
                    tags: tags,
                    keywords: keywords
                });
                
                this.logger.info("Successfully stored reflection for journal entry", {
                    path: note.path,
                    date: this.getTodayFormattedDate()
                });
                
                new Notice("Journal analysis completed and saved to reflection memory");
            } catch (storageError) {
                // Handle storage errors separately
                this.logger.error("Failed to store reflection", storageError);
                new Notice("Analysis completed but failed to save to reflection memory");
            }
        } catch (analysisError) {
            this.handleAnalysisError(analysisError);
        }
    }

    private handleAnalysisError(error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error("Error analyzing daily journal", error);
        new Notice(`Error analyzing daily journal: ${errorMessage}`);
    }

    /**
     * Extracts tags from note content
     * Looks for #tag format in the content
     */
    private extractTags(content: string): string[] {
        const tagRegex = /#([a-zA-Z0-9_-]+)/g;
        const matches = content.match(tagRegex);
        
        if (!matches) return [];
        
        // Remove the # prefix and return unique tags
        return [...new Set(matches.map(tag => tag.substring(1)))];
    }

    /**
     * Extracts keywords from the analysis result
     * This is a simple implementation - in a real app, you might use NLP or
     * have the AI model explicitly return keywords
     */
    private extractKeywords(analysisText: string): string[] {
        // Simple approach: split by spaces, filter out common words and punctuation
        const words = analysisText.toLowerCase().split(/\s+/);
        const commonWords = new Set([
            "the", "and", "a", "an", "in", "on", "at", "to", "for", "with", 
            "by", "about", "as", "of", "that", "this", "is", "are", "was", "were"
        ]);
        
        const filteredWords = words
            .map(word => word.replace(/[.,;:!?()'"]/g, '')) // Remove punctuation
            .filter(word => word.length > 3) // Only words longer than 3 chars
            .filter(word => !commonWords.has(word)); // Filter out common words
        
        // Get unique words and take top 10
        return [...new Set(filteredWords)].slice(0, 10);
    }
}
