import { LoggingService, LogLevel } from './LoggingService';
import { RecapitanSettings } from '../types';

describe('LoggingService', () => {
    // Mock console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    const originalConsoleDebug = console.debug;
    
    // Mock settings
    const mockSettings: Partial<RecapitanSettings> = {
        loggingEnabled: true,
        logLevel: 'info'
    };
    
    // Spy variables
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleDebugSpy: jest.SpyInstance;
    
    beforeEach(() => {
        // Setup spies
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    });
    
    afterEach(() => {
        // Restore original console methods
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleInfoSpy.mockRestore();
        consoleDebugSpy.mockRestore();
    });
    
    afterAll(() => {
        // Ensure console methods are restored
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
        console.debug = originalConsoleDebug;
    });
    
    describe('constructor', () => {
        it('should initialize with default values', () => {
            const logger = new LoggingService({} as RecapitanSettings);
            expect(logger['enabled']).toBe(false);
            expect(logger['level']).toBe(LogLevel.INFO);
        });
        
        it('should initialize with provided settings', () => {
            const logger = new LoggingService(mockSettings as RecapitanSettings, LogLevel.DEBUG, true);
            expect(logger['enabled']).toBe(true);
            expect(logger['level']).toBe(LogLevel.DEBUG);
        });
    });
    
    describe('setEnabled', () => {
        it('should update the enabled state', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.INFO, false);
            expect(logger['enabled']).toBe(false);
            
            logger.setEnabled(true);
            expect(logger['enabled']).toBe(true);
            
            logger.setEnabled(false);
            expect(logger['enabled']).toBe(false);
        });
    });
    
    describe('setLevel', () => {
        it('should update the log level', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.INFO);
            expect(logger['level']).toBe(LogLevel.INFO);
            
            logger.setLevel(LogLevel.DEBUG);
            expect(logger['level']).toBe(LogLevel.DEBUG);
            
            logger.setLevel(LogLevel.ERROR);
            expect(logger['level']).toBe(LogLevel.ERROR);
        });
    });
    
    describe('error', () => {
        it('should log errors when enabled and level is sufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.ERROR, true);
            const testError = new Error('Test error');
            
            logger.error('Error message', testError);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // Once for message, once for stack
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Error message'), testError);
        });
        
        it('should not log errors when disabled', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.ERROR, false);
            
            logger.error('Error message');
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
        
        it('should not log errors when level is insufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.NONE, true);
            
            logger.error('Error message');
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
        
        it('should log error stack when error object is provided', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.ERROR, true);
            const testError = new Error('Test error');
            
            logger.error('Error occurred', testError);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
            // First call with message
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR] Error occurred');
            // Second call with stack
            expect(consoleErrorSpy).toHaveBeenCalledWith(testError.stack);
        });
    });
    
    describe('warn', () => {
        it('should log warnings when enabled and level is sufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.WARN, true);
            
            logger.warn('Warning message');
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN] Warning message'));
        });
        
        it('should not log warnings when disabled', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.WARN, false);
            
            logger.warn('Warning message');
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
        
        it('should not log warnings when level is insufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.ERROR, true);
            
            logger.warn('Warning message');
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('info', () => {
        it('should log info when enabled and level is sufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.INFO, true);
            
            logger.info('Info message');
            expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO] Info message'));
        });
        
        it('should not log info when disabled', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.INFO, false);
            
            logger.info('Info message');
            expect(consoleInfoSpy).not.toHaveBeenCalled();
        });
        
        it('should not log info when level is insufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.WARN, true);
            
            logger.info('Info message');
            expect(consoleInfoSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('debug', () => {
        it('should log debug when enabled and level is sufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.DEBUG, true);
            
            logger.debug('Debug message');
            expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] Debug message'));
        });
        
        it('should not log debug when disabled', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.DEBUG, false);
            
            logger.debug('Debug message');
            expect(consoleDebugSpy).not.toHaveBeenCalled();
        });
        
        it('should not log debug when level is insufficient', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.INFO, true);
            
            logger.debug('Debug message');
            expect(consoleDebugSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('log level hierarchy', () => {
        it('should log all levels when set to DEBUG', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.DEBUG, true);
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            
            expect(consoleDebugSpy).toHaveBeenCalled();
            expect(consoleInfoSpy).toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        
        it('should log info, warn, error when set to INFO', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.INFO, true);
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        
        it('should log warn, error when set to WARN', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.WARN, true);
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        
        it('should log only error when set to ERROR', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.ERROR, true);
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        
        it('should log nothing when set to NONE', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.NONE, true);
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            
            expect(consoleDebugSpy).not.toHaveBeenCalled();
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('additional data logging', () => {
        it('should log additional data with messages', () => {
            const logger = new LoggingService({} as RecapitanSettings, LogLevel.DEBUG, true);
            const additionalData = { userId: 123, action: 'test' };
            
            logger.debug('Debug message', additionalData);
            expect(consoleDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining('[DEBUG] Debug message'), 
                additionalData
            );
            
            logger.info('Info message', additionalData);
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                expect.stringContaining('[INFO] Info message'), 
                additionalData
            );
        });
    });
});
