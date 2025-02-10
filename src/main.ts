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

