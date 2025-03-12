// src/types.ts

import { App } from 'obsidian';
import { DEFAULT_REFLECTION_TEMPLATE } from './prompts/reflectionPrompt';
import { DEFAULT_WEEKLY_REFLECTION_TEMPLATE } from './prompts/weeklyReflectionPrompt';

export type LoadingIndicatorPosition = "top" | "bottom" | "cursor";

export interface StreamingOptions {
    streamingUpdateInterval?: number;
    loadingIndicatorPosition?: LoadingIndicatorPosition;
    chunkSize?: number;
}

export interface StreamingAnalysisOptions {
    streamingUpdateInterval?: number;
    loadingIndicatorPosition?: LoadingIndicatorPosition;
    chunkSize?: number;
    analysisSchedule?: AnalysisSchedule;
    communicationStyle?: CommunicationStyle;
}

// Define union types
type AIProvider = 'openai' | 'ollama';
type AnalysisSchedule = 'daily' | 'manual';
type CommunicationStyle = 'direct' | 'gentle';

// Update the RecapitanSettings interface
export interface RecapitanSettings {
    apiKey: string;
    aiProvider: AIProvider;
    openaiModel: string;  // e.g. "gpt-4o", "gpt-3.5-turbo"
    ollamaEndpoint: string; // e.g. "http://localhost:11434/api/generate"
    ollamaModel: string; // e.g. "deepseek-r1:latest", "llama3.1:8b"
    reflectionTemplate: string;
    weeklyReflectionTemplate: string;
    analysisSchedule: AnalysisSchedule;
    communicationStyle: CommunicationStyle;
    privateMarker: string;
    ollamaHost: string;
    cacheTTLMinutes: number;
    cacheMaxSize: number;
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
    openaiModel: 'gpt-3.5-turbo',
    reflectionTemplate: DEFAULT_REFLECTION_TEMPLATE,
    weeklyReflectionTemplate: DEFAULT_WEEKLY_REFLECTION_TEMPLATE,
    analysisSchedule: 'daily',
    communicationStyle: 'direct',
    privateMarker: ':::private',
    ollamaHost: 'http://localhost:11434',
    cacheTTLMinutes: 60,
    cacheMaxSize: 100,
    ollamaEndpoint: 'http://localhost:11434/api/generate',
    ollamaModel: 'deepseek-r1:latest',
}
