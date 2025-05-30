// src/settings/SettingsTab.ts
import { PluginSettingTab, Setting, Notice } from "obsidian";
import RetrospectAI from "../main";
import { RetrospectAISettings, ExtendedApp } from "../types";
import providers from "../services/Providers";

export class RetrospectAISettingTab extends PluginSettingTab {
	plugin: RetrospectAI;

	constructor(app: ExtendedApp, plugin: RetrospectAI) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Saves the settings with feedback.
	 * @param callback {Function} The callback to save the settings
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
	 * Creates the provider settings
	 * @param containerEl {HTMLElement} The container element
	 */
	private createProviderSettings(containerEl: HTMLElement): void {
		// Create provider selection dropdown
		new Setting(containerEl)
			.setName("AI Provider")
			.setDesc("Choose your AI provider")
			.addDropdown((dropdown) => {
				// Add options from providers
				Object.entries(providers).forEach(([key, provider]) => {
					dropdown.addOption(key, provider.name);
				});
				
				dropdown
					.setValue(this.plugin.settings.aiProvider)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.aiProvider =
								value as RetrospectAISettings["aiProvider"];
							await this.plugin.saveSettings();
							// The saveSettings method will reinitialize services
							this.display();
						});
					});
			});

		// Get the current provider configuration
		const currentProvider = providers[this.plugin.settings.aiProvider];
		if (!currentProvider) {
			throw new Error(`Provider ${this.plugin.settings.aiProvider} not found`);
		}

		// Create provider-specific connection settings
		currentProvider.createConnectionSettings(
			containerEl,
			this.plugin.settings,
			async () => {
				await this.plugin.saveSettings();
			}
		);

		// Create provider-specific model settings
		currentProvider.createModelSettings(
			containerEl,
			this.plugin.settings,
			async () => {
				await this.plugin.saveSettings();
			}
		);
	}

	/**
	 * Creates the analysis settings
	 * @param containerEl {HTMLElement} The container element
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
								value as RetrospectAISettings["analysisSchedule"];
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
								value as RetrospectAISettings["communicationStyle"];
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
	 * @param containerEl {HTMLElement} The container element
	 */
	private createCacheSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Enable Cache')
			.setDesc('Enable caching of analysis results (disable for development/testing)')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.cacheEnabled)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.cacheEnabled = value;
							await this.plugin.saveSettings();
						});
					})
			);

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
	 * Creates the logging settings
	 */
	private createLoggingSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("Enable Logging")
			.setDesc("Enable detailed logging for troubleshooting")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.loggingEnabled)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.loggingEnabled = value;
							await this.plugin.saveSettings();
						});
					})
			);
			
		new Setting(containerEl)
			.setName("Log Level")
			.setDesc("Set the level of detail for logs")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("error", "Error (Minimal)")
					.addOption("warn", "Warning")
					.addOption("info", "Info (Recommended)")
					.addOption("debug", "Debug (Verbose)")
					.setValue(this.plugin.settings.logLevel)
					.onChange(async (value) => {
						await this.saveSettingsWithFeedback(async () => {
							this.plugin.settings.logLevel = value as RetrospectAISettings["logLevel"];
							await this.plugin.saveSettings();
						});
					})
			);
	}

	/**
	 * Creates the template settings
	 * @param containerEl {HTMLElement} The container element
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
	 * @param containerEl {HTMLElement} The container element
	 * @returns {void}
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
	 * @returns {void}
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

		containerEl.createEl("h2", { text: "Logging Settings" });
		this.createLoggingSettings(containerEl);
		
		// Add custom styles
		this.addCustomStyles(containerEl);
	}
}
