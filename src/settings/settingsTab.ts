// src/settings/SettingsTab.ts
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import Recapitan from '../main';
import { RecapitanSettings } from '../types';

export class RecapitanSettingTab extends PluginSettingTab {
    plugin: Recapitan;

    constructor(app: App, plugin: Recapitan) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private async saveSettingsWithFeedback(callback: () => Promise<void>) {
        const statusBar = this.app.statusBar.addStatusBarItem();
        statusBar.setText('Saving settings...');
        
        try {
            await callback();
            new Notice('Settings saved');
        } catch (error) {
            new Notice('Failed to save settings');
            throw error;
        } finally {
            statusBar.remove();
        }
    }

    display(): void {
        // Move settings UI code here...
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('AI Provider')
            .setDesc('Choose your AI provider')
            .addDropdown(dropdown => dropdown
                .addOption('openai', 'OpenAI')
                .addOption('ollama', 'Ollama')
                .setValue(this.plugin.settings.aiProvider)
                .onChange(async (value) => {
                    await this.saveSettingsWithFeedback(async () => {
                        this.plugin.settings.aiProvider = value as RecapitanSettings['aiProvider'];
                        await this.plugin.saveSettings();
                        this.display();
                    });
                }));

        new Setting(containerEl)
            .setName('Ollama Host')
            .setDesc('The URL of your Ollama instance')
            .addText(text => text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.ollamaHost)
                .onChange(async (value) => {
                    await this.saveSettingsWithFeedback(async () => {
                        this.plugin.settings.ollamaHost = value;
                        await this.plugin.saveSettings();
                    });
                }))
            .setDisabled(this.plugin.settings.aiProvider !== 'ollama');

        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Enter your AI provider API key')
            .addText(text => text
                .setPlaceholder('Enter API key...')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    await this.saveSettingsWithFeedback(async () => {
                        this.plugin.settings.apiKey = value;
                        await this.plugin.saveSettings();
                    });
                }));

        new Setting(containerEl)
            .setName('Analysis Schedule')
            .setDesc('When to run the analysis')
            .addDropdown(dropdown => dropdown
                .addOption('daily', 'Daily')
                .addOption('manual', 'Manual Only')
                .setValue(this.plugin.settings.analysisSchedule)
                .onChange(async (value) => {
                    await this.saveSettingsWithFeedback(async () => {
                        this.plugin.settings.analysisSchedule = value as RecapitanSettings['analysisSchedule'];
                        await this.plugin.saveSettings();
                    });
                }));

        new Setting(containerEl)
            .setName('Communication Style')
            .setDesc('Choose the tone of the AI responses')
            .addDropdown(dropdown => dropdown
                .addOption('direct', 'Direct and Clear')
                .addOption('gentle', 'Gentle and Supportive')
                .setValue(this.plugin.settings.communicationStyle)
                .onChange(async (value) => {
                    await this.saveSettingsWithFeedback(async () => {
                        this.plugin.settings.communicationStyle = value as RecapitanSettings['communicationStyle'];
                        await this.plugin.saveSettings();
                    });
                }));

        new Setting(containerEl)
            .setName('Private Content Marker')
            .setDesc('Marker for private content sections')
            .addText(text => text
                .setPlaceholder(':::private')
                .setValue(this.plugin.settings.privateMarker)
                .onChange(async (value) => {
                    await this.saveSettingsWithFeedback(async () => {
                        this.plugin.settings.privateMarker = value;
                        await this.plugin.saveSettings();
                    });
                }));

        new Setting(containerEl)
            .setName('Daily Reflection Template')
            .setDesc('Template for daily AI reflection prompts')
            .addTextArea(text => {
                text
                    .setValue(this.plugin.settings.reflectionTemplate)
                    .setPlaceholder('Enter your daily reflection template...')
                    .onChange(async (value) => {
                        await this.saveSettingsWithFeedback(async () => {
                            this.plugin.settings.reflectionTemplate = value;
                            await this.plugin.saveSettings();
                        });
                    });
                    
                // Customize the text area
                text.inputEl.rows = 6;
                text.inputEl.cols = 50;
                text.inputEl.addClass('reflection-template-input');
            });

        new Setting(containerEl)
            .setName('Weekly Reflection Template')
            .setDesc('Template for weekly reflection prompts')
            .addTextArea(text => {
                text
                    .setValue(this.plugin.settings.weeklyReflectionTemplate)
                    .setPlaceholder('Enter your weekly reflection template...')
                    .onChange(async (value) => {
                        await this.saveSettingsWithFeedback(async () => {
                            this.plugin.settings.weeklyReflectionTemplate = value;
                            await this.plugin.saveSettings();
                        });
                    });
                    
                // Customize the text area
                text.inputEl.rows = 6;
                text.inputEl.cols = 50;
                text.inputEl.addClass('reflection-template-input');
                
                // Add custom styles for the textarea
                const styleEl = document.createElement('style');
                styleEl.innerHTML = `
                    .reflection-template-input {
                        width: 100%;
                        font-family: var(--font-monospace);
                        resize: vertical;
                        min-height: 100px;
                        padding: 8px;
                    }
                `;
                containerEl.appendChild(styleEl);
            });

    }
}
