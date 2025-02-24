// StreamingManager.test.ts

import { Editor, EditorPosition, EditorScrollInfo, EditorSelection, EditorChange, EditorRange, EditorTransaction } from 'obsidian';
import { StreamingEditorManager } from './StreamingManager';

class MockEditor implements Editor {
    private content: string = '';
    private cursor: EditorPosition = { line: 0, ch: 0 };

    setValue(content: string): void {
        this.content = content;
    }

    getValue(): string {
        return this.content;
    }

    getCursor(): EditorPosition {
        return this.cursor;
    }

    setCursor(pos: EditorPosition): void {
        this.cursor = pos;
    }

    lineCount(): number {
        return this.content.split('\n').length;
    }

    listSelections(): EditorSelection[] {
        return [{
            anchor: this.cursor,
            head: this.cursor
        }];
    }

    setSelection(anchor: EditorPosition, head?: EditorPosition): void {
        this.cursor = anchor;
    }

    setSelections(ranges: EditorSelection[], main?: number): void {
        if (ranges.length > 0) {
            this.cursor = ranges[0].head;
        }
    }

    // Required interface methods with minimal implementations
    getDoc(): this { return this; }
    refresh(): void {}
    getLine(n: number): string { return this.content.split('\n')[n] || ''; }
    setLine(n: number, text: string): void {
        const lines = this.content.split('\n');
        lines[n] = text;
        this.content = lines.join('\n');
    }
    lastLine(): number { return this.lineCount() - 1; }
    getSelection(): string { return ''; }
    somethingSelected(): boolean { return false; }
    getRange(from: EditorPosition, to: EditorPosition): string { return ''; }
    replaceSelection(replacement: string): void {}
    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void {}
    getTokenAt(pos: EditorPosition): { start: number; end: number; string: string; type: string; } {
        return { start: 0, end: 0, string: '', type: '' };
    }
    getTokenTypeAt(pos: EditorPosition): string { return ''; }
    getLineTokens(line: number): { start: number; end: number; string: string; type: string; }[] { return []; }
    getStateAfter(line?: number): any { return null; }
    hasFocus(): boolean { return true; }
    focus(): void {}
    blur(): void {}
    getScrollInfo(): EditorScrollInfo {
        return {
            top: 0, left: 0,
            width: 0, height: 0,
            clientWidth: 0, clientHeight: 0
        };
    }
    scrollTo(x?: number | null, y?: number | null): void {}
    scrollIntoView(range: EditorRange, center?: boolean): void {}
    undo(): void {}
    redo(): void {}
    clearHistory(): void {}
    getHistory(): any { return {}; }
    setHistory(history: any): void {}
    exec(command: string): void {}
    transaction(tx: EditorTransaction, origin?: string): void {}
    on(event: string, handler: () => void): void {}
    off(event: string, handler: () => void): void {}
    
    // New required methods
    wordAt(pos: EditorPosition): EditorRange | null { return null; }
    posToOffset(pos: EditorPosition): number { return 0; }
    offsetToPos(offset: number): EditorPosition { return { line: 0, ch: 0 }; }
    processLines<T>(
        read: (line: number, lineText: string) => T | null,
        write: (line: number, lineText: string, value: T | null) => void | EditorChange,
        ignoreEmpty?: boolean
    ): void {}
}

describe('StreamingEditorManager', () => {
    let mockEditor: MockEditor;
    let streamingManager: StreamingEditorManager;
    const updateInterval = 0; // Fast updates for testing

    beforeEach(() => {
        mockEditor = new MockEditor();
        streamingManager = new StreamingEditorManager(mockEditor);
    });

    test('should stream content to editor', async () => {
        const initialContent = 'Initial content\n';
        const streamContent = 'Streamed content';
        const position = { line: 1, ch: 0 };

        mockEditor.setValue(initialContent);
        await streamingManager.streamContent(streamContent, updateInterval, position.line);

        expect(mockEditor.getValue()).toBe(initialContent + streamContent);
    });

    test('should handle streaming with cursor movement', async () => {
        const streamContent = 'Test content';
        const position = { line: 0, ch: 0 };

        await streamingManager.streamContent(streamContent, updateInterval, position.line);

        const finalPosition = mockEditor.getCursor();
        expect(finalPosition.line).toBe(position.line);
        expect(finalPosition.ch).toBe(streamContent.length);
    });

    test('should handle empty initial content', async () => {
        const streamContent = 'First content';
        const position = { line: 0, ch: 0 };

        await streamingManager.streamContent(streamContent, updateInterval, position.line);

        expect(mockEditor.getValue()).toBe(streamContent);
    });

    test('should handle multi-line streaming', async () => {
        const initialContent = 'Initial\n';
        const streamContent = 'Line 1\nLine 2\nLine 3';
        const position = { line: 1, ch: 0 };

        mockEditor.setValue(initialContent);
        await streamingManager.streamContent(streamContent, updateInterval, position.line);

        expect(mockEditor.getValue()).toBe(initialContent + streamContent);
        expect(mockEditor.lineCount()).toBe(4); // Initial + 3 new lines
    });
});