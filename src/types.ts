// src/types.ts
export interface RecapitanSettings {
    apiKey: string;
    aiProvider: 'openai' | 'ollama';
    model: string;
    reflectionTemplate: string;
    weeklyReflectionTemplate: string;
    analysisSchedule: 'daily' | 'manual';
    communicationStyle: 'direct' | 'gentle';
    privateMarker: string;
    ollamaHost: string;
}

import { DEFAULT_REFLECTION_TEMPLATE } from './prompts/reflectionPrompt';
import { DEFAULT_WEEKLY_REFLECTION_TEMPLATE } from './prompts/weeklyReflectionPrompt';

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
