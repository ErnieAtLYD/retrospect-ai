// main.ts
import { Plugin, Notice } from 'obsidian';
import { RecapitanSettings, DEFAULT_SETTINGS } from './types';
import { RecapitanSettingTab } from './settings/settingsTab';
import { AnalysisManager } from './services/AnalysisManager';
import { OpenAIService, DeepSeekService, AIService } from './services/AIService';
import { PrivacyManager } from './services/PrivacyManager';

export default class Recapitan extends Plugin {
    settings!: RecapitanSettings;
    private analysisManager!: AnalysisManager;
    private aiService!: AIService;
    private privacyManager!: PrivacyManager;

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onload() {
        await this.loadSettings();
        this.initializeServices();
        this.addSettingTab(new RecapitanSettingTab(this.app, this));
        this.addCommands();
    }

    private initializeServices() {
        this.privacyManager = new PrivacyManager(this.settings.privateMarker);
        
        switch (this.settings.aiProvider) {
            case 'openai':
                this.aiService = new OpenAIService(this.settings.apiKey, this.settings.model);
                break;
            case 'deepseek':
                this.aiService = new DeepSeekService();
                break;
            default:
                throw new Error('Unsupported AI provider');
        }

        this.analysisManager = new AnalysisManager(this.aiService, this.privacyManager);
    }

    private addCommands() {
        // Add command for manual analysis
        this.addCommand({
            id: 'analyze-current-note',
            name: 'Analyze Current Note',
            editorCallback: async (editor) => {
                const content = editor.getValue();
                try {
                    const analysis = await this.analyzeContent(content);
                    // Append analysis to the note
                    editor.setValue(content + '\n\n## AI Reflection\n' + analysis);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    new Notice(`Analysis failed: ${message}`);
                }
            }
        });

        // Add command for weekly analysis
        this.addCommand({
            id: 'analyze-past-week',
            name: 'Analyze Past Week',
            callback: async () => {
                try {
                    const entries = await this.getPastWeekEntries();
                    if (entries.length === 0) {
                        new Notice('No journal entries found for the past week');
                        return;
                    }

                    const analysis = await this.analyzeWeeklyContent(entries);
                    await this.createWeeklyReflectionNote(analysis);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    new Notice(`Weekly analysis failed: ${message}`);
                }
            }
        });
    }

    private async getPastWeekEntries(): Promise<{ date: string; content: string }[]> {
        const files = this.app.vault.getMarkdownFiles();
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        const entries = await Promise.all(
            files
                .filter(file => {
                    const match = file.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
                    if (!match) {
                    const fileDate = new Date(match[1]).getTime();
                    return fileDate >= oneWeekAgo && fileDate <= Date.now();
                })
                .map(async file => ({
                    date: file.name.replace('.md', ''),
                    content: await this.app.vault.read(file)
                }))
        );

        return entries.sort((a, b) => a.date.localeCompare(b.date));
    }

    private async analyzeWeeklyContent(entries: { date: string; content: string }[]): Promise<string> {
        const sanitizedEntries = entries.map(entry => ({
            date: entry.date,
            content: this.privacyManager.removePrivateSections(entry.content)
        }));

        const formattedContent = sanitizedEntries
            .map(entry => `## ${entry.date}\n\n${entry.content}`)
            .join('\n\n');

        return await this.aiService.analyze(
            formattedContent,
            this.settings.weeklyReflectionTemplate,
            this.settings.communicationStyle
        );
    }

    private async createWeeklyReflectionNote(analysis: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const fileName = `Weekly Reflections/${today} - Weekly Reflection.md`;
        
        // Create Weekly Reflections folder if it doesn't exist
        if (!await this.app.vault.adapter.exists('Weekly Reflections')) {
            await this.app.vault.createFolder('Weekly Reflections');
        }

        const content = `# Weekly Reflection - ${today}\n\n${analysis}`;
        await this.app.vault.create(fileName, content);
        
        // Open the new note
        const file = this.app.vault.getAbstractFileByPath(fileName);
        if (file) {
            await this.app.workspace.getLeaf().openFile(file);
        }
    }

    private async analyzeContent(content: string): Promise<string> {
        // Remove private sections before analysis
        content = this.privacyManager.removePrivateSections(content);
        
        return await this.aiService.analyze(
            content,
            this.settings.reflectionTemplate,
            this.settings.communicationStyle
        );
    }
}

