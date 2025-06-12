import { runTest } from './test';

describe('Test Command', () => {
  it('should return a basic message when verbose is false', () => {
    const result = runTest();
    expect(result).toBe('Running test command...');
  });

  it('should return a verbose message when verbose is true', () => {
    const result = runTest({ verbose: true });
    expect(result).toBe('Running test command with verbose output...');
  });
});