// src/core/CacheCommands.ts

import { Notice } from "obsidian";
import RetrospectAI from "../main";

export function registerCacheCommands(plugin: RetrospectAI) {
	plugin.addCommand({
		id: "clear-analysis-cache",
		name: "Clear Analysis Cache",
		callback: () => {
			plugin.serviceManager?.analysisManager?.clearCache();
			new Notice("Analysis cache cleared!", 3000);
		},
	});

	plugin.addCommand({
		id: "toggle-analysis-cache",
		name: "Toggle Analysis Cache",
		callback: async () => {
			plugin.settings.cacheEnabled = !plugin.settings.cacheEnabled;
			await plugin.saveSettings();
			new Notice(
				`Analysis cache ${
					plugin.settings.cacheEnabled ? "enabled" : "disabled"
				}!`,
				3000
			);
		},
	});

	plugin.addCommand({
		id: "show-cache-stats",
		name: "Show Cache Stats",
		callback: () => {
			const stats =
				plugin.serviceManager?.analysisManager?.getCacheStats();
			if (!stats) return new Notice("Cache stats unavailable", 3000);
			new Notice(
				`Cache: ${plugin.settings.cacheEnabled ? "on" : "off"}, Size: ${
					stats.size
				}, TTL: ${Math.round(stats.ttl / 60000)} min`,
				5000
			);
		},
	});
}
