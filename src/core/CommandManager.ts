// core/CommandManager.ts
import { Editor, MarkdownView, Notice } from "obsidian";
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
                const loadingNotice = new Notice("Analyzing note...", 0);

                try {
                    if (!this.plugin.serviceManager?.analysisManager) {
                        const errorDetails = {
                            serviceManager: !!this.plugin.serviceManager,
                            analysisManager: !!this.plugin.serviceManager?.analysisManager,
                            settings: this.plugin.settings
                        };
                        this.plugin.logger?.error("Analysis service initialization state", new Error(JSON.stringify(errorDetails)));
                        throw new Error("Analysis service not initialized. Please check the logs for more details.");
                    }

                    // Get the current template and style from settings
                    const template = this.plugin.settings.reflectionTemplate;
                    const style = this.plugin.settings.communicationStyle;

                    // Get the current file info
                    const currentFile = ctx.file;
                    const noteId = currentFile.path;
                    const noteName = currentFile.basename;

                    // Run the analysis
                    await this.plugin.serviceManager.analysisManager.analyzeContent(
                        content,
                        template,
                        style,
                        noteId,
                        noteName
                    );

                    loadingNotice.hide();
                    new Notice("Analysis complete! Check the side panel for results.", 3000);
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown error";
                    loadingNotice.hide();
                    new Notice(`Analysis failed: ${message}`, 5000);
                    this.plugin.logger?.error("Error during note analysis", error instanceof Error ? error : new Error(String(error)));
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
                    await this.plugin.serviceManager?.weeklyAnalysisService?.runWeeklyAnalysis();
                    
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
