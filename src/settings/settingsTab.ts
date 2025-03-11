// src/settings/SettingsTab.ts
import { PluginSettingTab, Setting, Notice } from "obsidian";
import Recapitan from "../main";
import { RecapitanSettings, ExtendedApp } from "../types";

export class RecapitanSettingTab extends PluginSettingTab {
	plugin: Recapitan;

	constructor(app: ExtendedApp, plugin: Recapitan) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Saves the settings with feedback.
	 * @param callback
	 */
	private async saveSettingsWithFeedback(callback: () => Promise<void>) {
		const statusBar = this.plugin.addStatusBarItem();
		statusBar.setText("Saving settings...");

		try {
			await callback();
			new Notice("Settings saved");
		} catch (error) {
			new Notice("Failed to save settings");
			throw error;
		} finally {
			statusBar.remove();
		}
	}

	/**
	 * Creates the AI provider selection settings
	 */
	private createProviderSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("AI Provider")
			.setDesc("Choose your AI provider")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("openai", "OpenAI")
					.addOption("ollama", "Ollama")
					.setValue(this.plugin.settings.aiProvider)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.aiProvider =
								value as RecapitanSettings["aiProvider"];
							await this.plugin.saveSettings();
							this.display();
						});
					})
			);

		// Provider-specific settings
		if (this.plugin.settings.aiProvider === "ollama") {
			new Setting(containerEl)
				.setName("Ollama Host")
				.setDesc("The URL of your Ollama instance")
				.addText((text) =>
					text
						.setPlaceholder("http://localhost:11434")
						.setValue(this.plugin.settings.ollamaHost)
						.onChange(async (value) => {
							await this.saveSettingsWithFeedback(async () => {
								this.plugin.settings.ollamaHost = value;
								await this.plugin.saveSettings();
							});
						})
				);
		}

		if (this.plugin.settings.aiProvider === "openai") {
			new Setting(containerEl)
				.setName("API Key")
				.setDesc("Enter your OpenAI API key")
				.addText((text) =>
					text
						.setPlaceholder("Enter API key...")
						.setValue(this.plugin.settings.apiKey)
						.onChange(async (value) => {
							await this.saveSettingsWithFeedback(async () => {
								this.plugin.settings.apiKey = value;
								await this.plugin.saveSettings();
							});
						})
				);
		}
	}

	/**
	 * Creates the analysis behavior settings
	 */
	private createAnalysisSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Analysis Schedule")
			.setDesc("When to run the analysis")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("daily", "Daily")
					.addOption("manual", "Manual Only")
					.setValue(this.plugin.settings.analysisSchedule)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.analysisSchedule =
								value as RecapitanSettings["analysisSchedule"];
							await this.plugin.saveSettings();
						});
					})
			);

		new Setting(containerEl)
			.setName("Communication Style")
			.setDesc("Choose the tone of the AI responses")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("direct", "Direct and Clear")
					.addOption("gentle", "Gentle and Supportive")
					.setValue(this.plugin.settings.communicationStyle)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.communicationStyle =
								value as RecapitanSettings["communicationStyle"];
							await this.plugin.saveSettings();
						});
					})
			);

		new Setting(containerEl)
			.setName("Private Content Marker")
			.setDesc("Marker for private content sections")
			.addText((text) =>
				text
					.setPlaceholder(":::private")
					.setValue(this.plugin.settings.privateMarker)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.privateMarker = value;
							await this.plugin.saveSettings();
						});
					})
			);
	}

	/**
	 * Creates the cache settings
	 */
	private createCacheSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Cache Duration')
			.setDesc('How long to cache analysis results (in minutes)')
			.addText((text) =>
				text
					.setPlaceholder('60')
					.setValue(String(this.plugin.settings.cacheTTLMinutes))
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							const numValue = parseInt(value) || 60;
							this.plugin.settings.cacheTTLMinutes = numValue;
							await this.plugin.saveSettings();
						});
					})
			);

		new Setting(containerEl)
			.setName('Maximum Cache Size')
			.setDesc('Maximum number of entries to keep in cache')
			.addText((text) =>
				text
					.setPlaceholder('100')
					.setValue(String(this.plugin.settings.cacheMaxSize))
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							const numValue = parseInt(value) || 100;
							this.plugin.settings.cacheMaxSize = numValue;
							await this.plugin.saveSettings();
						});
					})
			);
	}

	/**
	 * Creates the template settings with text areas
	 */
	private createTemplateSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Daily Reflection Template")
			.setDesc("Template for daily AI reflection prompts")
			.addTextArea((text) => {
				text.setValue(this.plugin.settings.reflectionTemplate)
					.setPlaceholder("Enter your daily reflection template...")
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.reflectionTemplate = value;
							await this.plugin.saveSettings();
						});
					});

				// Customize the text area
				text.inputEl.rows = 6;
				text.inputEl.cols = 50;
				text.inputEl.addClass("reflection-template-input");
			});

		new Setting(containerEl)
			.setName("Weekly Reflection Template")
			.setDesc("Template for weekly reflection prompts")
			.addTextArea((text) => {
				text.setValue(this.plugin.settings.weeklyReflectionTemplate)
					.setPlaceholder("Enter your weekly reflection template...")
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.weeklyReflectionTemplate =
								value;
							await this.plugin.saveSettings();
						});
					});

				// Customize the text area
				text.inputEl.rows = 6;
				text.inputEl.cols = 50;
				text.inputEl.addClass("reflection-template-input");
			});
	}

	/**
	 * Adds custom styles for the settings
	 */
	private addCustomStyles(containerEl: HTMLElement): void {
		const styleEl = document.createElement("style");
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
	}

	/**
	 * Displays the settings UI.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Add section headings and call the appropriate methods
		containerEl.createEl("h2", { text: "AI Provider Settings" });
		this.createProviderSettings(containerEl);
		
		containerEl.createEl("h2", { text: "Analysis Settings" });
		this.createAnalysisSettings(containerEl);
		
		containerEl.createEl("h2", { text: "Cache Settings" });
		this.createCacheSettings(containerEl);
		
		containerEl.createEl("h2", { text: "Templates" });
		this.createTemplateSettings(containerEl);
		
		// Add custom styles
		this.addCustomStyles(containerEl);
	}
}
