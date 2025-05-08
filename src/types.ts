// src/types.ts

import { App } from "obsidian";
import { DEFAULT_REFLECTION_TEMPLATE } from "./prompts/reflectionPrompt";
import { DEFAULT_WEEKLY_REFLECTION_TEMPLATE } from "./prompts/weeklyReflectionPrompt";

export const COMMENTARY_VIEW_TYPE = "commentary-view";

// Interface for storing note analysis data
export interface NoteAnalysis {
  noteId?: string;
  noteName?: string;
  content: string;
  timestamp: number;
}

// Define union types
export type LoadingIndicatorPosition = "top" | "bottom" | "cursor";
export type LogLevel = "error" | "warn" | "info" | "debug";
export type AIProvider = "openai" | "ollama" | "anthropic";
export type AnalysisSchedule = "daily" | "manual";
export type CommunicationStyle = "direct" | "gentle";

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

// Update the RetrospectAISettings interface
export interface RetrospectAISettings {
	apiKey: string;
	aiProvider: AIProvider;
	openaiModel: string; // e.g. "gpt-4o", "gpt-3.5-turbo"
	ollamaEndpoint: string; // e.g. "http://localhost:11434/api/generate"
	ollamaModel: string; // e.g. "deepseek-r1:latest", "llama3.1:8b"
	anthropicModel: string; // e.g. "claude-3-opus-20240229", "claude-3-sonnet-20240229"
	anthropicApiKey: string;
	reflectionTemplate: string;
	weeklyReflectionTemplate: string;
	analysisSchedule: AnalysisSchedule;
	communicationStyle: CommunicationStyle;
	privateMarker: string;
	ollamaHost: string;
	cacheTTLMinutes: number;
	cacheMaxSize: number;
	loggingEnabled: boolean;
	commentaryViewEnabled: boolean;
	logLevel: LogLevel;
	analysisHistory?: NoteAnalysis[]; // Store analysis history
}

// Extend the App interface to include statusBar
export interface ExtendedApp extends App {
	statusBar: {
		addStatusBarItem: () => {
			setText: (text: string) => void;
			remove: () => void;
		};
	} & App["statusBar"];
}

export const DEFAULT_RETROSPECT_AI_SETTINGS: RetrospectAISettings = {
	apiKey: "",
	aiProvider: "openai",
	openaiModel: "gpt-3.5-turbo",
	reflectionTemplate: DEFAULT_REFLECTION_TEMPLATE,
	weeklyReflectionTemplate: DEFAULT_WEEKLY_REFLECTION_TEMPLATE,
	analysisSchedule: "daily",
	communicationStyle: "direct",
	privateMarker: ":::private",
	ollamaHost: "http://localhost:11434",
	cacheTTLMinutes: 60,
	cacheMaxSize: 100,
	ollamaEndpoint: "http://localhost:11434/api/generate",
	ollamaModel: "deepseek-r1:latest",
	loggingEnabled: false,
	logLevel: "info",
	anthropicModel: "claude-3-haiku-20240307",
	anthropicApiKey: "",
	commentaryViewEnabled: true,
	analysisHistory: [],
};
