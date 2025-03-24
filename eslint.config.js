// eslint.config.js

import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
	// base config for all TS files
	{
		files: ["**/*.{js,ts}", "jest.config.js"],
		ignores: [
			"node_modules/**",
			"dist/**",
			"build/**",
			".git/**",
			".obsidian/**"
		],
		languageOptions: {
			parser: tsparser,
			sourceType: "module",
			ecmaVersion: "latest",
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: ".",
			},
			globals: {
				// Browser globals
				window: true,
				document: true,
				console: true,
				// Node.js globals
				process: true,
				global: true,
				require: true,
				module: true,
				__dirname: true,
				// Timer functions
				setTimeout: true,
				clearTimeout: true,
				setInterval: true,
				clearInterval: true,
				// Fetch API
				fetch: true,
				// Node.js types
				NodeJS: true
			}
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			...eslint.configs.recommended.rules,
			...tseslint.configs["eslint-recommended"].rules,
			...tseslint.configs.recommended.rules,
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			"@typescript-eslint/ban-ts-comment": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-empty-function": "off",
			"no-case-declarations": "off"
		},
	},
	// config for all test files
	{
		files: [
			"**/*.test.{js,ts}",
			"**/*.spec.{js,ts}",
			"**/tests/**/*.{js,ts}",
			"**/__tests__/**/*.{js,ts}",
			"**/__mocks__/**/*.{js,ts}"
		],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: ".",
			},
			globals: {
				describe: "readonly",
				it: "readonly",
				expect: "readonly",
				test: "readonly",
				jest: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/ban-types": "off",
			"@typescript-eslint/no-unused-vars": ["off"]
		},
	},
	// config for utility files
	{
		files: [
			"**/utils/**/*.{js,ts}",
			"**/helpers/**/*.{js,ts}"
		],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: ".",
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off"
		},
	},
];
