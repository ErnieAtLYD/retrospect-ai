// src/__mocks__/MockPlugin.ts
import { App } from 'obsidian';
// Mock Plugin class
export class MockPlugin {
	saveData: (data: any) => Promise<void>;
	loadData: () => Promise<any>;

	constructor(app: App) {
		// Initialize with basic mock functions
		this.saveData = async () => {};
		this.loadData = async () => ({});
	}
}