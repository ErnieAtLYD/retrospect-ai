# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Test all: `npm run test`
- Test single file: `jest path/to/file.test.ts`
- Test watch mode: `npm run test:watch`
- Test coverage: `npm run test:coverage`
- Development: `npm run dev`

## Code Style Guidelines
- TypeScript with strict typing
- React for UI components with JSX
- ESLint for linting (follows recommended TypeScript configs)
- Imports: Group by external, internal, then relative paths
- Error handling: Custom error classes with cause pattern
- Testing: Jest with JSDOM environment, descriptive test names
- Type definitions in interfaces with proper documentation
- Class-based architecture with dependency injection
- Logging through LoggingService with timestamps
- Mocks in __mocks__ directory following Jest patterns