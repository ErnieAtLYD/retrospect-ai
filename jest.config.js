module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ["**/__tests__/**/*.test.ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    moduleDirectories: ["node_modules", "src"],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                "strict": true,
                "esModuleInterop": true,
                "moduleResolution": "node",
                "baseUrl": "src"
            }
        }]
    }
};
