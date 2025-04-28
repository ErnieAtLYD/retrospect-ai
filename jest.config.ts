  import type { Config } from 'jest';

  const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/src/$1',
      '^obsidian$': '<rootDir>/src/__mocks__/obsidian.ts' // Add this line
    },
    transform: {
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          tsconfig: 'tsconfig.json'
        }
      ]
    },
    testMatch: ['**/__tests__/**/*.test.ts?(x)'],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/__tests__/**'
    ],
    moduleDirectories: [
      'node_modules',
      'src/__mocks__'
    ]
  };

  export default config; 