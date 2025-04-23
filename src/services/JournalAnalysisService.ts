import { App, Editor, MarkdownView, Notice, TFile } from "obsidian";
import { AnalysisManager } from "./AnalysisManager";
import { LoggingService } from "./LoggingService";
import { StreamingEditorManager } from "./StreamingManager";
import { RetrospectAISettings } from "../types";

export class JournalAnalysisService {
    constructor(
        private app: App,
        private settings: RetrospectAISettings,
        private analysisManager: AnalysisManager,
        private logger: LoggingService
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
     * @returns
     */
    async analyzeContent(content: string): Promise<string> {
        try {
            await this.analysisManager.analyzeContent(
                content,
                this.settings.reflectionTemplate,
                this.settings.communicationStyle
            );
            return "Analysis complete"; // Return a string since the method is expected to return Promise<string>
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
     * @returns
     */
    private async performAnalysis(editor: Editor, note: TFile): Promise<void> {
        const streamingManager = new StreamingEditorManager(editor);
        new Notice("Analyzing today's journal entry...");

        const content = await this.getNoteContent(note);
        await streamingManager.streamAnalysis(
            this.analyzeContent(content),
            {
                loadingIndicatorPosition: "bottom",
                streamingUpdateInterval: 50,
            }
        );
    }

    private handleAnalysisError(error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error("Error analyzing daily journal", error);
        new Notice(`Error analyzing daily journal: ${errorMessage}`);
    }
}
