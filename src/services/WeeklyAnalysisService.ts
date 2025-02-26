// src/services/WeeklyAnalysisService.ts
import { RecapitanSettings } from "../types";
import { App } from "obsidian";
import { PrivacyManager } from "./PrivacyManager";
import { AIService } from "./AIService";
import { TFile } from "obsidian";

export class WeeklyAnalysisService {
	constructor(
		private settings: RecapitanSettings,
		private app: App,
		private privacyManager: PrivacyManager,
		private aiService: AIService
	) {}

	/**
	 * Run the weekly analysis process
	 * @returns Promise<void>
	 */
	async runWeeklyAnalysis(): Promise<void> {
		const entries = await this.getPastWeekEntries();
		if (entries.length === 0) {
			throw new Error("No journal entries found for the past week");
		}
		const analysis = await this.analyzeWeeklyContent(entries);
		await this.createWeeklyReflectionNote(analysis);
	}

	/**
	 * Get all journal entries from the past week
	 * @returns Array of objects with date and content
	 */
	async getPastWeekEntries(): Promise<{ date: string; content: string }[]> {
		const files = this.app.vault.getMarkdownFiles() as TFile[];
		const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
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
		const sanitizedEntries = entries.map((entry) => ({
			date: entry.date,
			content: this.privacyManager.removePrivateSections(entry.content),
		}));

		const formattedContent = sanitizedEntries
			.map((entry) => `## ${entry.date}\n\n${entry.content}`)
			.join("\n\n");

		return await this.aiService.analyze(
			formattedContent,
			this.settings.weeklyReflectionTemplate,
			this.settings.communicationStyle
		);
	}

	async createWeeklyReflectionNote(analysis: string): Promise<void> {
		// Implementation of createWeeklyReflectionNote method
	}
}
