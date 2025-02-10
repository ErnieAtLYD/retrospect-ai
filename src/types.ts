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

export const DEFAULT_SETTINGS: RecapitanSettings = {
    apiKey: '',
    aiProvider: 'openai',
    model: 'gpt-4',
    reflectionTemplate: 'Review the following journal entry and provide insights on:\n- Key themes\n- Emotional patterns\n- Action items\n- Growth opportunities',
    analysisSchedule: 'daily',
    communicationStyle: 'direct',
    privateMarker: ':::private'
}