// Jest setup file

// Mock the global window object
global.window = Object.create(window);

// Mock createRoot from react-dom/client
jest.mock("react-dom/client", () => ({
	createRoot: jest.fn().mockReturnValue({
		render: jest.fn(),
		unmount: jest.fn(),
	}),
}));

// Mock React
jest.mock("react", () => ({
	...jest.requireActual("react"),
	useState: jest
		.fn()
		.mockImplementation((initialValue) => [initialValue, jest.fn()]),
	useEffect: jest.fn().mockImplementation((fn) => fn()),
	createElement: jest.fn(),
	StrictMode: ({ children }: { children: any }) => children,
}));

// Note: Obsidian mock is now in src/__tests__/__mocks__/obsidian.ts
