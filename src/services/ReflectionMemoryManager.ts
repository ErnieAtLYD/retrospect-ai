import { App } from "obsidian";
import { LoggingService } from "./LoggingService";
import { RetrospectAISettings } from "../types";

/**
 * Represents a single reflection entry in the memory system
 */
export interface ReflectionEntry {
	id: string;
	date: string;
	sourceNotePath: string;
	reflectionText: string;
	tags: string[];
	keywords: string[];
	timestamp: number;
}

/**
 * Interface for the reflection index file structure
 */
interface ReflectionIndex {
	version: string;
	entries: ReflectionEntry[];
	lastUpdated: number;
}

/**
 * Error class for reflection memory operations
 */
export class ReflectionMemoryError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ReflectionMemoryError";
	}
}

/**
 * Manages the storage and retrieval of reflection entries
 */
export class ReflectionMemoryManager {
	private readonly STORAGE_FOLDER = ".retrospect-ai";
	private readonly INDEX_FILE = "reflection-index.json";
	private readonly DEFAULT_INDEX: ReflectionIndex = {
		version: "1.0",
		entries: [],
		lastUpdated: Date.now(),
	};

	private index: ReflectionIndex;
	private loaded = false;

	constructor(
		private app: App,
		private settings: RetrospectAISettings,
		private logger?: LoggingService
	) {
		this.index = { ...this.DEFAULT_INDEX };
	}

	/**
	 * Initializes the reflection memory system
     * @returns {Promise<void>} A promise that resolves when the reflection memory system is initialized
     * @description Initializes the reflection memory system
     * @throws {ReflectionMemoryError} If the reflection memory system cannot be initialized
     * @example
     * await this.initialize();
     * // The reflection memory system is now initialized
	 */
	async initialize(): Promise<void> {
		try {
			this.logger?.debug("Initializing ReflectionMemoryManager");
			await this.ensureStorageFolder();
			await this.loadIndex();
			this.loaded = true;
			this.logger?.info(
				"ReflectionMemoryManager initialized successfully"
			);
		} catch (error) {
			this.logger?.error(
				"Failed to initialize ReflectionMemoryManager",
				error
			);
			throw new ReflectionMemoryError(
				`Failed to initialize: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Ensures the storage folder exists
     * @returns {Promise<void>} A promise that resolves when the storage folder is ensured
     * @description Ensures the storage folder exists
     * @throws {ReflectionMemoryError} If the storage folder cannot be created
     * @example
     * await this.ensureStorageFolder();
     * // The storage folder is now ensured
	 */
	private async ensureStorageFolder(): Promise<void> {
		try {
			const folderExists = await this.app.vault.adapter.exists(
				this.STORAGE_FOLDER
			);
			if (!folderExists) {
				this.logger?.debug(
					`Creating storage folder: ${this.STORAGE_FOLDER}`
				);
				// Use adapter.createFolder instead of vault.createFolder
				await this.app.vault.adapter.createFolder(this.STORAGE_FOLDER);
			}
		} catch (error) {
			this.logger?.error(
				`Failed to create storage folder: ${this.STORAGE_FOLDER}`,
				error
			);
			throw new ReflectionMemoryError(
				`Failed to create storage folder: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Loads the reflection index from disk
     * @returns {Promise<void>} A promise that resolves when the reflection index is loaded
     * @description Loads the reflection index from disk
     * @example
     * await this.loadIndex();
     * // The reflection index is now loaded from disk
	 */
	private async loadIndex(): Promise<void> {
		const indexPath = `${this.STORAGE_FOLDER}/${this.INDEX_FILE}`;

		try {
			const exists = await this.app.vault.adapter.exists(indexPath);

			if (exists) {
				this.logger?.debug(
					`Loading reflection index from: ${indexPath}`
				);
				const content = await this.app.vault.adapter.read(indexPath);
				try {
					this.index = JSON.parse(content);
					// Ensure the index has the required structure
					if (!this.index.entries) {
						this.index.entries = [];
					}
					if (!this.index.version) {
						this.index.version = this.DEFAULT_INDEX.version;
					}
					if (!this.index.lastUpdated) {
						this.index.lastUpdated = Date.now();
					}
				} catch (parseError) {
					this.logger?.warn(
						`Failed to parse reflection index, falling back to default index: ${parseError}`
					);
					this.index = { ...this.DEFAULT_INDEX };
					await this.saveIndex();
				}
				this.logger?.info(
					`Loaded ${this.index.entries.length} reflection entries`
				);
			} else {
				this.logger?.info(
					"No existing reflection index found, creating new index"
				);
				this.index = { ...this.DEFAULT_INDEX };
				await this.saveIndex();
			}
		} catch (error) {
			this.logger?.error(
				`Failed to load reflection index: ${indexPath}`,
				error
			);
			throw new ReflectionMemoryError(
				`Failed to load reflection index: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Saves the reflection index to disk
     * @returns {Promise<void>} A promise that resolves when the reflection index is saved
     * @description Saves the reflection index to disk
     * @example
     * await this.saveIndex();
     * // The reflection index is now saved to disk
	 */
	private async saveIndex(): Promise<void> {
		const indexPath = `${this.STORAGE_FOLDER}/${this.INDEX_FILE}`;

		try {
			this.logger?.debug(`Saving reflection index to: ${indexPath}`);
			this.index.lastUpdated = Date.now();
			await this.app.vault.adapter.write(
				indexPath,
				JSON.stringify(this.index, null, 2)
			);
			this.logger?.info(
				`Saved ${this.index.entries.length} reflection entries`
			);
		} catch (error) {
			this.logger?.error(
				`Failed to save reflection index: ${indexPath}`,
				error
			);
			throw new ReflectionMemoryError(
				`Failed to save reflection index: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Adds a new reflection entry
     * @param {Omit<ReflectionEntry, "id" | "timestamp">} entry - The reflection entry to add
     * @returns {Promise<ReflectionEntry>} The added reflection entry
     * @description Adds a new reflection entry to the memory system
     * @example
     * const newReflection = await this.addReflection({
     *     date: "2023-01-01",
     *     sourceNotePath: "path/to/source/note.md",
     *     reflectionText: "Reflection text",
     *     tags: ["tag1", "tag2"],
     *     keywords: ["keyword1", "keyword2"]
     * });
     * console.log(newReflection); // ReflectionEntry
	 */
	async addReflection(
		entry: Omit<ReflectionEntry, "id" | "timestamp">
	): Promise<ReflectionEntry> {
		if (!this.loaded) {
			await this.initialize();
		}

		try {
			const newEntry: ReflectionEntry = {
				...entry,
				id: this.generateId(),
				timestamp: Date.now(),
			};

			this.logger?.debug(`Adding new reflection entry: ${newEntry.id}`);
			this.index.entries.push(newEntry);
			await this.saveIndex();

			return newEntry;
		} catch (error) {
			this.logger?.error("Failed to add reflection entry", error);
			throw new ReflectionMemoryError(
				`Failed to add reflection: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Updates an existing reflection entry
     * @param {string} id - The ID of the reflection entry to update
     * @param {Partial<Omit<ReflectionEntry, "id">>} updates - The updates to apply to the reflection entry
     * @returns {Promise<ReflectionEntry | null>} The updated reflection entry or null if it wasn't found
     * @description Updates an existing reflection entry by ID
     * @example
     * const updatedReflection = await this.updateReflection("1234567890", {
     *     reflectionText: "Updated reflection text",
     *     tags: ["tag1", "tag2"]
     * });
     * console.log(updatedReflection); // ReflectionEntry
	 */
	async updateReflection(
		id: string,
		updates: Partial<Omit<ReflectionEntry, "id">>
	): Promise<ReflectionEntry | null> {
		if (!this.loaded) {
			await this.initialize();
		}

		try {
			const entryIndex = this.index.entries.findIndex(
				(entry) => entry.id === id
			);

			if (entryIndex === -1) {
				this.logger?.warn(`Reflection entry not found: ${id}`);
				return null;
			}

			const updatedEntry = {
				...this.index.entries[entryIndex],
				...updates,
				timestamp: Date.now(),
			};

			this.logger?.debug(`Updating reflection entry: ${id}`);
			this.index.entries[entryIndex] = updatedEntry;
			await this.saveIndex();

			return updatedEntry;
		} catch (error) {
			this.logger?.error(
				`Failed to update reflection entry: ${id}`,
				error
			);
			throw new ReflectionMemoryError(
				`Failed to update reflection: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Deletes a reflection entry
     * @param {string} id - The ID of the reflection entry to delete
     * @returns {Promise<boolean>} True if the reflection entry was deleted, false if it wasn't found
     * @description Deletes a reflection entry by ID
     * @example
     * const success = await this.deleteReflection("1234567890");
     * console.log(success); // true
	 */
	async deleteReflection(id: string): Promise<boolean> {
		if (!this.loaded) {
			await this.initialize();
		}

		try {
			const initialLength = this.index.entries.length;
			this.index.entries = this.index.entries.filter(
				(entry) => entry.id !== id
			);

			if (this.index.entries.length === initialLength) {
				this.logger?.warn(
					`Reflection entry not found for deletion: ${id}`
				);
				return false;
			}

			this.logger?.debug(`Deleting reflection entry: ${id}`);
			await this.saveIndex();
			return true;
		} catch (error) {
			this.logger?.error(
				`Failed to delete reflection entry: ${id}`,
				error
			);
			throw new ReflectionMemoryError(
				`Failed to delete reflection: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Gets a reflection entry by ID
     * @param {string} id - The ID of the reflection entry to get
     * @returns {Promise<ReflectionEntry | null>} The reflection entry or null if it doesn't exist
     * @description Gets a reflection entry by ID
     * @example
     * const reflection = await this.getReflection("1234567890");
     * console.log(reflection); // ReflectionEntry
	 */
	async getReflection(id: string): Promise<ReflectionEntry | null> {
		if (!this.loaded) {
			await this.initialize();
		}

		try {
			const entry = this.index.entries.find((entry) => entry.id === id);
			return entry || null;
		} catch (error) {
			this.logger?.error(`Failed to get reflection entry: ${id}`, error);
			throw new ReflectionMemoryError(
				`Failed to get reflection: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Gets all reflection entries
     * @returns {Promise<ReflectionEntry[]>} An array of all reflection entries
     * @description Gets all reflection entries
     * @example
     * const allReflections = await this.getAllReflections();
     * console.log(allReflections); // [ReflectionEntry, ReflectionEntry]
	 */
	async getAllReflections(): Promise<ReflectionEntry[]> {
		if (!this.loaded) {
			await this.initialize();
		}

		try {
			return [...this.index.entries];
		} catch (error) {
			this.logger?.error("Failed to get all reflection entries", error);
			throw new ReflectionMemoryError(
				`Failed to get all reflections: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Searches for reflection entries by various criteria
     * @param {Object} options - The search options
     * @param {string} [options.text] - The text to search for
     * @param {string[]} [options.tags] - The tags to search for
     * @param {string[]} [options.keywords] - The keywords to search for
     * @param {string} [options.dateFrom] - The start date to search from
     * @param {string} [options.dateTo] - The end date to search to
     * @param {string} [options.sourcePath] - The source path to search for
     * @returns {Promise<ReflectionEntry[]>} An array of reflection entries that match the search criteria
     * @description Searches for reflection entries by various criteria
     * @example
     * const results = await this.searchReflections({
     *     text: "example",
     *     tags: ["tag1", "tag2"],
     *     keywords: ["keyword1", "keyword2"])
     * console.log(results); // [ReflectionEntry, ReflectionEntry]
	 */
	async searchReflections(options: {
		text?: string;
		tags?: string[];
		keywords?: string[];
		dateFrom?: string;
		dateTo?: string;
		sourcePath?: string;
	}): Promise<ReflectionEntry[]> {
		if (!this.loaded) {
			await this.initialize();
		}

		try {
			let results = [...this.index.entries];

			if (options.text) {
				const searchText = options.text.toLowerCase();
				results = results.filter((entry) =>
					entry.reflectionText.toLowerCase().includes(searchText)
				);
			}

			if (options.tags && options.tags.length > 0) {
				results = results.filter((entry) =>
					options.tags!.some((tag) => entry.tags.includes(tag))
				);
			}

			if (options.keywords && options.keywords.length > 0) {
				results = results.filter((entry) =>
					options.keywords!.some((keyword) =>
						entry.keywords.includes(keyword)
					)
				);
			}

			if (options.dateFrom) {
				results = results.filter(
					(entry) => entry.date >= options.dateFrom!
				);
			}

			if (options.dateTo) {
				results = results.filter(
					(entry) => entry.date <= options.dateTo!
				);
			}

			if (options.sourcePath) {
				results = results.filter((entry) =>
					entry.sourceNotePath.includes(options.sourcePath!)
				);
			}

			return results;
		} catch (error) {
			this.logger?.error("Failed to search reflection entries", error);
			throw new ReflectionMemoryError(
				`Failed to search reflections: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * Generates a unique ID for a new reflection entry
     * @returns {string} The unique ID
     * @description Generates a unique ID for a new reflection entry
     * @example
     * const id = this.generateId();
     * console.log(id); // "1234567890"
	 */
	private generateId(): string {
		return (
			Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
		);
	}
}
