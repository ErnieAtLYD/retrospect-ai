// src/__tests__/ReflectionMemoryManager.test.ts

import {
	ReflectionMemoryManager,
	ReflectionEntry,
	ReflectionMemoryError,
} from "../services/ReflectionMemoryManager";
import { LoggingService, LogLevel } from "../services/LoggingService";
import { RetrospectAISettings } from "../types";
import { describe, it, beforeEach, afterEach, expect } from "@jest/globals";

// Mock Obsidian App
class MockVaultAdapter {
	private files: Record<string, string> = {};
	private folders: Set<string> = new Set();

	async exists(path: string): Promise<boolean> {
		return this.folders.has(path) || Object.keys(this.files).includes(path);
	}

	async read(path: string): Promise<string> {
		if (this.files[path]) {
			return this.files[path];
		}
		throw new Error(`File not found: ${path}`);
	}

	async write(path: string, data: string): Promise<void> {
		this.files[path] = data;
	}

	async createFolder(path: string): Promise<void> {
		this.folders.add(path);
	}

	// Helper methods for testing
	_getFile(path: string): string | undefined {
		return this.files[path];
	}

	_reset(): void {
		this.files = {};
		this.folders = new Set();
	}
}

class MockVault {
	adapter: MockVaultAdapter = new MockVaultAdapter();

	async createFolder(path: string): Promise<void> {
		await this.adapter.createFolder(path);
	}
}

class MockApp {
	vault: MockVault = new MockVault();
}

describe("ReflectionMemoryManager", () => {
	let app: MockApp;
	let settings: RetrospectAISettings;
	let logger: LoggingService;
	let manager: ReflectionMemoryManager;

	beforeEach(() => {
		app = new MockApp();
		settings = {} as RetrospectAISettings; // Minimal settings for testing
		logger = new LoggingService(settings, LogLevel.DEBUG, true);
		manager = new ReflectionMemoryManager(app as any, settings, logger);
	});

	afterEach(() => {
		(app.vault.adapter as MockVaultAdapter)._reset();
	});

	describe("initialization", () => {
		it("should create storage folder if it does not exist", async () => {
			await manager.initialize();
			const folderExists = await app.vault.adapter.exists(
				".retrospect-ai"
			);
			expect(folderExists).toBe(true);
		});

		it("should create a new index file if it does not exist", async () => {
			await manager.initialize();
			const indexContent = (
				app.vault.adapter as MockVaultAdapter
			)._getFile(".retrospect-ai/reflection-index.json");
			expect(indexContent).toBeDefined();

			const index = JSON.parse(indexContent!);
			expect(index).toHaveProperty("version", "1.0");
			expect(index).toHaveProperty("entries");
			expect(Array.isArray(index.entries)).toBe(true);
			expect(index.entries).toHaveLength(0);
		});

		it("should load existing index file if it exists", async () => {
			// Create an existing index file
			const existingIndex = {
				version: "1.0",
				entries: [
					{
						id: "test-id",
						date: "2023-05-01",
						sourceNotePath: "test/path.md",
						reflectionText: "Test reflection",
						tags: ["test"],
						keywords: ["testing"],
						timestamp: 1682924400000,
					},
				],
				lastUpdated: 1682924400000,
			};

			await app.vault.adapter.createFolder(".retrospect-ai");
			await app.vault.adapter.write(
				".retrospect-ai/reflection-index.json",
				JSON.stringify(existingIndex)
			);

			await manager.initialize();

			// Get all reflections to verify the index was loaded
			const reflections = await manager.getAllReflections();
			expect(reflections).toHaveLength(1);
			expect(reflections[0]).toHaveProperty("id", "test-id");
		});
	});

	describe("CRUD operations", () => {
		beforeEach(async () => {
			await manager.initialize();
		});

		it("should add a new reflection entry", async () => {
			const newEntry = {
				date: "2023-05-01",
				sourceNotePath: "test/path.md",
				reflectionText: "Test reflection",
				tags: ["test"],
				keywords: ["testing"],
			};

			const result = await manager.addReflection(newEntry);

			// Check that all properties from newEntry are present in result
			(
				Object.entries(newEntry) as [keyof ReflectionEntry, unknown][]
			).forEach(([key, value]) => {
				expect(result[key]).toEqual(value);
			});

			// Check additional properties
			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("timestamp");
			expect(typeof result.id).toBe("string");
			expect(typeof result.timestamp).toBe("number");

			// Verify it was saved to the index
			const reflections = await manager.getAllReflections();
			expect(reflections).toHaveLength(1);
			expect(reflections[0]).toEqual(result);
		});

		it("should get a reflection by id", async () => {
			const newEntry = {
				date: "2023-05-01",
				sourceNotePath: "test/path.md",
				reflectionText: "Test reflection",
				tags: ["test"],
				keywords: ["testing"],
			};

			const added = await manager.addReflection(newEntry);
			const retrieved = await manager.getReflection(added.id);

			expect(retrieved).toEqual(added);
		});

		it("should return null when getting a non-existent reflection", async () => {
			const retrieved = await manager.getReflection("non-existent-id");
			expect(retrieved).toBeNull();
		});

		it("should update an existing reflection", async () => {
			const newEntry = {
				date: "2023-05-01",
				sourceNotePath: "test/path.md",
				reflectionText: "Test reflection",
				tags: ["test"],
				keywords: ["testing"],
			};

			const added = await manager.addReflection(newEntry);

			const updates = {
				reflectionText: "Updated reflection",
				tags: ["test", "updated"],
			};

			const updated = await manager.updateReflection(added.id, updates);

			expect(updated).not.toBeNull();
			expect(updated!.reflectionText).toBe("Updated reflection");
			expect(updated!.tags).toEqual(["test", "updated"]);
			expect(updated!.timestamp).toBeGreaterThanOrEqual(added.timestamp);

			// Other properties should remain unchanged
			expect(updated!.date).toBe(added.date);
			expect(updated!.sourceNotePath).toBe(added.sourceNotePath);
			expect(updated!.keywords).toEqual(added.keywords);
		});

		it("should return null when updating a non-existent reflection", async () => {
			const updated = await manager.updateReflection("non-existent-id", {
				reflectionText: "Updated",
			});
			expect(updated).toBeNull();
		});

		it("should delete an existing reflection", async () => {
			const newEntry = {
				date: "2023-05-01",
				sourceNotePath: "test/path.md",
				reflectionText: "Test reflection",
				tags: ["test"],
				keywords: ["testing"],
			};

			const added = await manager.addReflection(newEntry);
			const deleteResult = await manager.deleteReflection(added.id);

			expect(deleteResult).toBe(true);

			// Verify it was removed from the index
			const reflections = await manager.getAllReflections();
			expect(reflections).toHaveLength(0);
		});

		it("should return false when deleting a non-existent reflection", async () => {
			const deleteResult = await manager.deleteReflection(
				"non-existent-id"
			);
			expect(deleteResult).toBe(false);
		});

		it("should get all reflections", async () => {
			const entries = [
				{
					date: "2023-05-01",
					sourceNotePath: "test/path1.md",
					reflectionText: "Test reflection 1",
					tags: ["test"],
					keywords: ["testing"],
				},
				{
					date: "2023-05-02",
					sourceNotePath: "test/path2.md",
					reflectionText: "Test reflection 2",
					tags: ["test", "important"],
					keywords: ["testing", "priority"],
				},
			];

			await manager.addReflection(entries[0]);
			await manager.addReflection(entries[1]);

			const allReflections = await manager.getAllReflections();
			expect(allReflections).toHaveLength(2);
		});
	});

	describe("search functionality", () => {
		beforeEach(async () => {
			await manager.initialize();

			// Add test data
			const entries = [
				{
					date: "2023-05-01",
					sourceNotePath: "journal/daily.md",
					reflectionText:
						"This is a test reflection about productivity",
					tags: ["productivity", "test"],
					keywords: ["work", "focus"],
				},
				{
					date: "2023-05-15",
					sourceNotePath: "journal/weekly.md",
					reflectionText: "Weekly reflection on health and exercise",
					tags: ["health", "exercise"],
					keywords: ["fitness", "wellness"],
				},
				{
					date: "2023-06-01",
					sourceNotePath: "projects/ideas.md",
					reflectionText: "Project ideas for improving productivity",
					tags: ["productivity", "projects"],
					keywords: ["ideas", "work"],
				},
			];

			for (const entry of entries) {
				await manager.addReflection(entry);
			}
		});

		it("should search by text content", async () => {
			const results = await manager.searchReflections({ text: "health" });
			expect(results).toHaveLength(1);
			expect(results[0].reflectionText).toContain("health");
		});

		it("should search by tags", async () => {
			const results = await manager.searchReflections({
				tags: ["productivity"],
			});
			expect(results).toHaveLength(2);
		});

		it("should search by keywords", async () => {
			const results = await manager.searchReflections({
				keywords: ["work"],
			});
			expect(results).toHaveLength(2);
		});

		it("should search by date range", async () => {
			const results = await manager.searchReflections({
				dateFrom: "2023-05-10",
				dateTo: "2023-05-20",
			});
			expect(results).toHaveLength(1);
			expect(results[0].date).toBe("2023-05-15");
		});

		it("should search by source path", async () => {
			const results = await manager.searchReflections({
				sourcePath: "journal",
			});
			expect(results).toHaveLength(2);
		});

		it("should combine multiple search criteria", async () => {
			const results = await manager.searchReflections({
				text: "productivity",
				tags: ["projects"],
				dateFrom: "2023-06-01",
			});
			expect(results).toHaveLength(1);
			expect(results[0].sourceNotePath).toBe("projects/ideas.md");
		});

		it("should return empty array when no matches found", async () => {
			const results = await manager.searchReflections({
				text: "nonexistent",
			});
			expect(results).toEqual([]);
		});
	});

	describe('error handling', () => {
        it('should throw ReflectionMemoryError when file operations fail', async () => {
          // Mock a failure in the adapter
          const originalExists = app.vault.adapter.exists;
          app.vault.adapter.exists = async () => { throw new Error('Simulated error'); };
          
          // Test that it throws the expected error type and contains the expected message
          let error: any = null;
          try {
            await manager.initialize();
          } catch (e) {
            error = e;
          }
          
          expect(error).toBeInstanceOf(ReflectionMemoryError);
          expect(error.message).toContain('Failed to create storage folder');
          
          // Restore original method
          app.vault.adapter.exists = originalExists;
        });
      
        it('should handle errors during index loading', async () => {
          // First create the folder and index file
          await app.vault.adapter.createFolder('.retrospect-ai');
          await app.vault.adapter.write('.retrospect-ai/reflection-index.json', '{}');
          
          // Mock a failure in the adapter's read method
          const originalRead = app.vault.adapter.read;
          app.vault.adapter.read = async () => { throw new Error('Simulated read error'); };
          
          // Test that it throws the expected error
          let error: any = null;
          try {
            await manager.initialize();
          } catch (e) {
            error = e;
          }
          
          expect(error).toBeInstanceOf(ReflectionMemoryError);
          expect(error.message).toContain('Failed to load reflection index');
          
          // Restore original method
          app.vault.adapter.read = originalRead;
        });

		// Add a new test case to verify fallback to default index when JSON.parse fails from invalid JSON
		it('should fallback to default index when index file contains invalid JSON', async () => {
			// First, create the folder and write invalid JSON to the index file
			await app.vault.adapter.createFolder('.retrospect-ai');
			await app.vault.adapter.write('.retrospect-ai/reflection-index.json', 'INVALID_JSON');
		
			let error: any = null;
		
			try {
			await manager.initialize();
			} catch (e) {
			error = e;
			}
		
			// Verify that no ReflectionMemoryError is thrown (i.e. the error is caught) 
			// and that the manager falls back to a default index (assumed to be an empty object)
			expect(error).toBeNull();
			const reflections = await manager.getAllReflections();
			expect(reflections).toEqual([]);
		});
  
      
        it('should handle errors during index saving', async () => {
          // Mock a failure in the adapter's write method
          const originalWrite = app.vault.adapter.write;
          app.vault.adapter.write = async () => { throw new Error('Simulated write error'); };
          
          // Setup manager for this test
          await manager.initialize().catch(() => {
            // Ignore initialization errors since we're testing the write error
          });
          
          const newEntry = {
            date: '2023-05-01',
            sourceNotePath: 'test/path.md',
            reflectionText: 'Test reflection',
            tags: ['test'],
            keywords: ['testing']
          };
          
          // Test that adding a reflection fails with the expected error
          let error: any = null;
          try {
            await manager.addReflection(newEntry);
          } catch (e) {
            error = e;
          }
          
          expect(error).toBeInstanceOf(ReflectionMemoryError);
          expect(error.message).toContain('Failed to save reflection index');
          
          // Restore original method
          app.vault.adapter.write = originalWrite;
        });
      });
});
