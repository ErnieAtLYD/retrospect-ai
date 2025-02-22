// src/types.ts

import { App } from 'obsidian';
import { DEFAULT_REFLECTION_TEMPLATE } from './prompts/reflectionPrompt';
import { DEFAULT_WEEKLY_REFLECTION_TEMPLATE } from './prompts/weeklyReflectionPrompt';

export interface AIReflectionSettings {
    aiProvider: string;
    apiKey: string;
    analysisSchedule: string;
    communicationStyle: string;
    privacyLevel: string;
    outputFormat: string;
}

export interface StreamingOptions {
    streamingUpdateInterval?: number;
    loadingIndicatorPosition?: 'top' | 'bottom' | 'cursor';
    chunkSize?: number;
}

// Define union types
type AIProvider = 'openai' | 'ollama';
type AnalysisSchedule = 'daily' | 'manual';
type CommunicationStyle = 'direct' | 'gentle';

// Update the RecapitanSettings interface
export interface RecapitanSettings {
    apiKey: string;
    aiProvider: AIProvider;
    model: string;
    reflectionTemplate: string;
    weeklyReflectionTemplate: string;
    analysisSchedule: AnalysisSchedule;
    communicationStyle: CommunicationStyle;
    privateMarker: string;
    ollamaHost: string;
}


// Extend the App interface to include statusBar
export interface ExtendedApp extends App {
	statusBar: {
		addStatusBarItem: () => {
			setText: (text: string) => void;
			remove: () => void;
		};
	};
}

export const DEFAULT_SETTINGS: RecapitanSettings = {
    apiKey: '',
    aiProvider: 'openai',
    model: 'gpt-4',
    reflectionTemplate: DEFAULT_REFLECTION_TEMPLATE,
    weeklyReflectionTemplate: DEFAULT_WEEKLY_REFLECTION_TEMPLATE,
    analysisSchedule: 'daily',
    communicationStyle: 'direct',
    privateMarker: ':::private',
    ollamaHost: 'http://localhost:11434'
}