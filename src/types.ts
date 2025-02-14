// src/types.ts
export interface RecapitanSettings {
    apiKey: string;
    aiProvider: 'openai' | 'deepseek' | 'local';
    model: string;
    reflectionTemplate: string;
    analysisSchedule: 'daily' | 'manual';
    communicationStyle: 'direct' | 'gentle';
    privateMarker: string;
}

import { DEFAULT_REFLECTION_TEMPLATE } from './prompts/reflectionPrompt';

export const DEFAULT_SETTINGS: RecapitanSettings = {
    apiKey: '',
    aiProvider: 'openai',
    model: 'gpt-4',
    reflectionTemplate: DEFAULT_REFLECTION_TEMPLATE,
    analysisSchedule: 'daily',
    communicationStyle: 'direct',
    privateMarker: ':::private'
}
