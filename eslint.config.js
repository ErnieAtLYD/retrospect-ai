// eslint.config.js

import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
	// base config for all TS files
	{
		files: ["**/*.{js,ts}"],
		ignores: [],
		languageOptions: {
			parser: tsparser,
			sourceType: "module",
			parserOptions: {
				ecmaVersion: "latest",
			},
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
		},
	},
	// config for all test files
	{
		files: [
			"**/*.test.{js,ts}",
			"**/*.spec.{js,ts}",
			"**/tests/**/*.{js,ts}",
			"**/__tests__/**/*.{js,ts}",
		],
		languageOptions: {
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
	},
];
