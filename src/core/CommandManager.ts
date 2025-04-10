// core/CommandManager.ts
import { Editor, MarkdownView, Notice } from "obsidian";
import { StreamingEditorManager } from "../services/StreamingManager";
import RetrospectAI from "../main";

export class CommandManager {
    private plugin: RetrospectAI;

    constructor(plugin: RetrospectAI) {
        this.plugin = plugin;
    }

    registerCommands() {
        this.registerAnalyzeNoteCommand();
        this.registerWeeklyAnalysisCommand();
    }

    private registerAnalyzeNoteCommand() {
        this.plugin.addCommand({
            id: "analyze-current-note",
            name: "Analyze Current Note",
            editorCallback: async (editor: Editor, ctx: any) => {
                if (!(ctx instanceof MarkdownView)) {
                    new Notice("This command can only be used in a Markdown view.", 5000);
                    return;
                }

                const content = editor.getValue();
                const streamingManager = new StreamingEditorManager(editor);

                try {
                    // Create a promise for the analysis
                    const analysisPromise = this.plugin.serviceManager.analyzeContent(content);

                    // Use streaming manager to handle the updates
                    await streamingManager.streamAnalysis(analysisPromise, {
                        streamingUpdateInterval: 150,
                        loadingIndicatorPosition: "cursor",
                        chunkSize: 75,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown error";
                    new Notice(`Analysis failed: ${message}`, 5000);
                }
            },
        });
    }

    private registerWeeklyAnalysisCommand() {
        this.plugin.addCommand({
            id: "analyze-past-week",
            name: "Analyze Past Week",
            callback: async () => {
                const loadingNotice = new Notice("Analyzing past week...", 0);
                if (this.plugin.uiManager.statusBarItem) {
                    this.plugin.uiManager.statusBarItem.setText("Analyzing past week...");
                }
                
                try {
                    await this.plugin.serviceManager.weeklyAnalysisService.runWeeklyAnalysis();
                    
                    loadingNotice.hide();
                    new Notice("Weekly analysis complete!", 3000);
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown error";
                    loadingNotice.hide();
                    new Notice(`Weekly analysis failed: ${message}`, 5000);
                } finally {
                    if (this.plugin.uiManager.statusBarItem) {
                        this.plugin.uiManager.statusBarItem.setText("");
                    }
                }
            },
        });
    }
}