// src/services/Providers.ts

import { Setting } from "obsidian";
import { RetrospectAISettings, AIProvider } from "types";

interface ProviderConfig {
	name: string;
	createConnectionSettings: (
		containerEl: HTMLElement,
		settings: RetrospectAISettings,
		saveCallback: () => Promise<void>
	) => void;
	createModelSettings: (
		containerEl: HTMLElement,
		settings: RetrospectAISettings,
		saveCallback: () => Promise<void>
	) => void;
}

/**
 * Providers is a record of provider configurations.
 * Each provider has a name, and a function to create
 * connection settings and model settings.
 * The connection settings are used to create a
 * connection to the provider, and the model settings
 * are used to select the model to use.
 */
const providers: Record<AIProvider, ProviderConfig> = {
	openai: {
		name: "OpenAI",
		createConnectionSettings: (containerEl, settings, saveCallback) => {
			new Setting(containerEl)
				.setName("OpenAI API Key")
				.setDesc("Enter your OpenAI API key")
				.addTextArea((text) => {
					text.setValue(settings.apiKey).onChange(async (value) => {
						settings.apiKey = value;
						await saveCallback();
					});
				});
		},
		createModelSettings: (containerEl, settings, saveCallback) => {
			new Setting(containerEl)
				.setName("OpenAI Model")
				.setDesc("Select the OpenAI model to use")
				.addDropdown((dropdown) => {
					dropdown
						.addOption("gpt-4o", "GPT-4o")
						.addOption("gpt-3.5-turbo", "GPT-3.5 Turbo")
						.setValue(settings.openaiModel)
						.onChange(async (value) => {
							settings.openaiModel = value;
							await saveCallback();
						});
				});
		},
	},
	ollama: {
		name: "Ollama",
		createConnectionSettings: (containerEl, settings, saveCallback) => {
			new Setting(containerEl)
				.setName("Ollama Host")
				.setDesc("Enter the Ollama host")
				.addTextArea((text) => {
					text.setValue(settings.ollamaHost).onChange(
						async (value) => {
							settings.ollamaHost = value;
							await saveCallback();
						}
					);
				});
		},
		createModelSettings: (containerEl, settings, saveCallback) => {
			new Setting(containerEl)
				.setName("Ollama Model")
				.setDesc("Select the Ollama model to use")
				.addDropdown((dropdown) => {
					dropdown
						.addOption("llama3.1", "Llama 3.1")
						.addOption("llama3.1:8b", "Llama 3.1 8B")
						.setValue(settings.ollamaModel)
						.onChange(async (value) => {
							settings.ollamaModel = value;
							await saveCallback();
						});
				});
		},
	},
	anthropic: {
		name: "Anthropic",
		createConnectionSettings: (containerEl, settings, saveCallback) => {
			new Setting(containerEl)
				.setName("Anthropic API Key")
				.setDesc("Enter your Anthropic API key")
				.addTextArea((text) => {
					text.setValue(settings.anthropicApiKey).onChange(
						async (value) => {
							settings.anthropicApiKey = value;
							await saveCallback();
						}
					);
				});
		},
		createModelSettings: (containerEl, settings, saveCallback) => {
			new Setting(containerEl)
				.setName("Anthropic Model")
				.setDesc("Select the Anthropic Claude model to use")
				.addDropdown((dropdown) => {
					dropdown
						.addOption("claude-3-opus-20240229", "Claude 3 Opus")
						.addOption("claude-3-sonnet-20240229", "Claude 3 Sonnet")
						.addOption("claude-3-haiku-20240307", "Claude 3 Haiku")
						.setValue(settings.anthropicModel)
						.onChange(async (value) => {
							settings.anthropicModel = value;
							await saveCallback();
						});
				});
		},
	},
};

export default providers;
