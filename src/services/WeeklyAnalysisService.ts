// src/services/WeeklyAnalysisService.ts
import { RecapitanSettings } from "../types";
import { App, TFile } from "obsidian";
import { PrivacyManager } from "./PrivacyManager";
import { AIService } from "./AIService";
import { LoggingService } from "./LoggingService";

export class WeeklyAnalysisService {
    private logger?: LoggingService;

    constructor(
        private settings: RecapitanSettings,
        private app: App,
        private privacyManager: PrivacyManager,
        private aiService: AIService,
        logger?: LoggingService
    ) {
        this.logger = logger;
    }

	/**
	 * Run the weekly analysis process
	 * @returns Promise<void>
	 */
	async runWeeklyAnalysis(): Promise<void> {
        this.logger?.info("Starting weekly analysis process");
        
        const entries = await this.getPastWeekEntries();
        if (entries.length === 0) {
            const errorMsg = "No journal entries found for the past week";
            this.logger?.error(errorMsg);
            throw new Error(errorMsg);
        }
        
        this.logger?.info(`Found ${entries.length} journal entries for analysis`);
        
        try {
            const analysis = await this.analyzeWeeklyContent(entries);
            this.logger?.debug("Weekly content analysis completed");
            
            await this.createWeeklyReflectionNote(analysis);
            this.logger?.info("Weekly reflection note created successfully");
        } catch (error) {
            this.logger?.error("Error during weekly analysis", error as Error);
            throw error;
        }
    }

	/**
	 * Get all journal entries from the past week
	 * @returns Array of objects with date and content
	 */
	async getPastWeekEntries(): Promise<{ date: string; content: string }[]> {
        this.logger?.debug("Retrieving journal entries from the past week");
        
        const files = this.app.vault.getMarkdownFiles() as TFile[];
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        this.logger?.debug(`Looking for entries after ${new Date(oneWeekAgo).toISOString()}`);
        
        const entries = await Promise.all(
            files
                .filter((file: TFile) => {
                    const match = file.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
                    if (!match) return false;
                    const fileDate = new Date(match[1]).getTime();
                    return fileDate >= oneWeekAgo && fileDate <= Date.now();
                })
                .map(async (file: TFile) => ({
                    date: file.name.replace(".md", ""),
                    content: await this.app.vault.read(file),
                }))
        );
        
        this.logger?.debug(`Found ${entries.length} entries in the past week`);
        
        return entries.sort(
            (
                a: { date: string; content: string },
                b: { date: string; content: string }
            ) => a.date.localeCompare(b.date)
        );
    }

	/**
	 * Analyze the weekly content of journal entries
	 * @param entries Array of objects with date and content
	 * @returns Analyzed content
	 */
	async analyzeWeeklyContent(
		entries: { date: string; content: string }[]
	): Promise<string> {
        this.logger?.info(`Analyzing ${entries.length} journal entries`);
        
        const sanitizedEntries = entries.map((entry) => ({
            date: entry.date,
            content: this.privacyManager.removePrivateSections(entry.content),
        }));
        
        this.logger?.debug("Private sections removed from all entries");

        const formattedContent = sanitizedEntries
            .map((entry) => `## ${entry.date}\n\n${entry.content}`)
            .join("\n\n");
            
        this.logger?.debug("Content formatted for analysis");

        try {
            this.logger?.info("Sending content to AI service for analysis");
            return await this.aiService.analyze(
                formattedContent,
                this.settings.weeklyReflectionTemplate,
                this.settings.communicationStyle
            );
        } catch (error) {
            this.logger?.error("Error during weekly content analysis", error as Error);
            throw error;
        }
    }

	async createWeeklyReflectionNote(analysis: string): Promise<void> {
        const today = new Date().toISOString().split("T")[0];
        const fileName = `Weekly Reflections/${today} - Weekly Reflection.md`;
        
        this.logger?.info(`Creating weekly reflection note: ${fileName}`);

        try {
            // Create Weekly Reflections folder if it doesn't exist
            if (!(await this.app.vault.adapter.exists("Weekly Reflections"))) {
                this.logger?.debug("Creating Weekly Reflections folder");
                await this.app.vault.createFolder("Weekly Reflections");
            }

            const content = `# Weekly Reflection - ${today}\n\n${analysis}`;
            this.logger?.debug("Creating weekly reflection file");
            await this.app.vault.create(fileName, content);

            // Open the new note
            const file = this.app.vault.getAbstractFileByPath(fileName);
            if (file instanceof TFile) {
                this.logger?.debug("Opening the newly created reflection file");
                await this.app.workspace.getLeaf().openFile(file);
            } else {
                this.logger?.warn("Could not find the created file to open it");
            }
        } catch (error) {
            this.logger?.error("Error creating weekly reflection note", error as Error);
            throw error;
        }
    }
}
