// src/__mocks__/MockEditor.ts
import { Editor, EditorPosition } from 'obsidian';

export class MockEditor implements Partial<Editor> {
    private content: string = '';
    private cursor: EditorPosition = { line: 0, ch: 0 };

    // Required Editor interface methods
    getDoc() {
        return {
            getValue: () => this.content,
            setValue: (value: string) => { this.content = value; },
            getCursor: () => this.cursor,
            setCursor: (pos: EditorPosition) => { this.cursor = pos; },
            lineCount: () => this.content.split('\n').length,
            getLine: (n: number) => this.content.split('\n')[n] || '',
            replaceRange: (replacement: string, from: EditorPosition, to: EditorPosition) => {
                const lines = this.content.split('\n');
                const startLine = lines[from.line] || '';
                const endLine = lines[to.line] || '';
                const before = startLine.substring(0, from.ch);
                const after = endLine.substring(to.ch);
                lines.splice(from.line, to.line - from.line + 1, before + replacement + after);
                this.content = lines.join('\n');
            },
            refresh: () => {},
            getRange: (from: EditorPosition, to: EditorPosition) => {
                const lines = this.content.split('\n');
                let result = '';
                for (let i = from.line; i <= to.line; i++) {
                    const line = lines[i] || '';
                    if (i === from.line && i === to.line) {
                        result += line.substring(from.ch, to.ch);
                    } else if (i === from.line) {
                        result += line.substring(from.ch) + '\n';
                    } else if (i === to.line) {
                        result += line.substring(0, to.ch);
                    } else {
                        result += line + '\n';
                    }
                }
                return result;
            },
            setLine: (n: number, text: string) => {
                const lines = this.content.split('\n');
                lines[n] = text;
                this.content = lines.join('\n');
            },
            lastLine: () => this.content.split('\n').length - 1,
            getSelection: () => '',
            somethingSelected: () => false,
            replaceSelection: (replacement: string) => {
                // Mock implementation
            },
            listSelections: () => [],
            // Add other methods as needed
        };
    }

    refresh() {
        // Mock implementation
    }

    setValue(content: string) {
        this.content = content;
    }

    getValue() {
        return this.content;
    }

    getLine(n: number) {
        return this.content.split('\n')[n] || '';
    }

    lineCount() {
        return this.content.split('\n').length;
    }

    getCursor() {
        return this.cursor;
    }

    setCursor(pos: EditorPosition) {
        this.cursor = pos;
    }

    getRange(from: EditorPosition, to: EditorPosition): string {
        const lines = this.content.split('\n');
        let result = '';
        
        for (let i = from.line; i <= to.line; i++) {
            const line = lines[i] || '';
            if (i === from.line && i === to.line) {
                result += line.substring(from.ch, to.ch);
            } else if (i === from.line) {
                result += line.substring(from.ch) + '\n';
            } else if (i === to.line) {
                result += line.substring(0, to.ch);
            } else {
                result += line + '\n';
            }
        }
        
        return result;
    }
}

export default MockEditor;