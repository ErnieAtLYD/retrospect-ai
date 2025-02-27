// StreamingManager.test.ts

import { Editor, EditorPosition, EditorScrollInfo, EditorSelection, EditorChange, EditorRange, EditorTransaction } from 'obsidian';
import { StreamingEditorManager } from './StreamingManager';
import { StreamingAnalysisOptions } from '../types';

describe('StreamingEditorManager', () => {
    let mockEditor: jest.Mocked<Editor>;
    let streamingManager: StreamingEditorManager;
    const updateInterval = 0; // Fast updates for testing


    // Mock console.log to avoid cluttering test output
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {

        mockEditor = {
            getCursor: jest.fn(),
            getValue: jest.fn(),
            getLine: jest.fn(),
            setValue: jest.fn(),
            lineCount: jest.fn(),
            setCursor: jest.fn(),
            replaceRange: jest.fn(),
        } as unknown as jest.Mocked<Editor>
        streamingManager = new StreamingEditorManager(mockEditor);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("streamAnalysis", () => {
        const mockCursorPosition: EditorPosition = { line: 5, ch: 0 };
        const mockAnalysisResult = 'Test analysis result';
        beforeEach(() => {
            mockEditor.getCursor.mockReturnValue(mockCursorPosition);
            mockEditor.getValue.mockReturnValue("existing content");
            mockEditor.lineCount.mockReturnValue(10);
        });

        it("should successfully stream analysis with default options", async () => {
            const analysisPromise = Promise.resolve(mockAnalysisResult);
            await streamingManager.streamAnalysis(analysisPromise);
            expect(mockEditor.getCursor).toHaveBeenCalled();
            expect(mockEditor.replaceRange).toHaveBeenCalled();
            expect(mockEditor.setValue).toHaveBeenCalled();
        });        

        it("should handle custom options", async () => {
            const customOptions: StreamingAnalysisOptions = {
                streamingUpdateInterval: 50,
                loadingIndicatorPosition: "top",
                chunkSize: 100
            };
            
            const analysisPromise = Promise.resolve(mockAnalysisResult);
            await streamingManager.streamAnalysis(analysisPromise, customOptions);

            expect(mockEditor.getCursor).toHaveBeenCalled();
            expect(mockEditor.replaceRange).toHaveBeenCalled();
        });

        it("should handle errors during analysis", async () => {
            const error = new Error("Test error");
            const failedPromise = Promise.reject(error);

            await streamingManager.streamAnalysis(failedPromise);

            expect(mockEditor.replaceRange).toHaveBeenCalledWith(
                expect.stringContaining("Error during analysis: Test error"),
                expect.any(Object),
                expect.any(Object)
            );
        });

        it("should handle unknown errors during analysis", async () => {
            const unknownError = "Unknown error object";
            // @ts-ignore
            const failedPromise = Promise.reject(unknownError);

            await streamingManager.streamAnalysis(failedPromise);

            expect(mockEditor.replaceRange).toHaveBeenCalledWith(
                expect.stringContaining("Error during analysis: Unknown error"),
                expect.any(Object),
                expect.any(Object)
            );
        });

        it("should clean up loading indicator in case of error", async () => {
            const error = new Error("Test error");
            const failedPromise = Promise.reject(error);

            await streamingManager.streamAnalysis(failedPromise);

            // Verify that stopLoadingIndicator was called in finally block
            expect(mockEditor.replaceRange).toHaveBeenCalledWith(
                "",
                expect.any(Object),
                expect.any(Object)
            );
        });

        it("should format content with AI Reflection header", async () => {
            const analysisPromise = Promise.resolve("Test content");
            
            await streamingManager.streamAnalysis(analysisPromise);

            expect(mockEditor.setValue).toHaveBeenCalledWith(
                expect.stringContaining("## AI Reflection\nTest content")
            );
        });
    });
});