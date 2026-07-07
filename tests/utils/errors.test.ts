import { describe, it, expect } from 'vitest';
import { ZenDisconnectedError, isDisconnectionError } from '../../src/utils/errors.js';

describe('ZenDisconnectedError', () => {
  it('should create error with default message', () => {
    const error = new ZenDisconnectedError();
    expect(error.name).toBe('ZenDisconnectedError');
    expect(error.message).toContain('Zen browser is not connected');
    expect(error.message).toContain('restart_zen tool');
    expect(error.message).toContain('zenPath parameter');
  });

  it('should create error with custom reason', () => {
    const error = new ZenDisconnectedError('Browser was closed');
    expect(error.message).toContain('Browser was closed');
    expect(error.message).toContain('Zen browser is not connected');
    expect(error.message).toContain('restart_zen tool');
  });

  it('should be instanceof Error', () => {
    const error = new ZenDisconnectedError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ZenDisconnectedError);
  });
});

describe('isDisconnectionError', () => {
  it('should return true for ZenDisconnectedError', () => {
    const error = new ZenDisconnectedError();
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for session deleted errors', () => {
    const error = new Error('Session deleted because of page crash');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for no such window errors', () => {
    const error = new Error('no such window: target window already closed');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for no such session errors', () => {
    const error = new Error('no such session');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for connection refused errors', () => {
    const error = new Error('ECONNREFUSED: Connection refused');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for driver not connected errors', () => {
    const error = new Error('Driver not connected');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for not connected errors', () => {
    const error = new Error('Not connected');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for invalid session id errors', () => {
    const error = new Error('invalid session id');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return true for browsing context discarded errors', () => {
    const error = new Error('browsing context has been discarded');
    expect(isDisconnectionError(error)).toBe(true);
  });

  it('should return false for unrelated errors', () => {
    const error = new Error('Element not found');
    expect(isDisconnectionError(error)).toBe(false);
  });

  it('should return false for non-Error values', () => {
    expect(isDisconnectionError('string error')).toBe(false);
    expect(isDisconnectionError(null)).toBe(false);
    expect(isDisconnectionError(undefined)).toBe(false);
    expect(isDisconnectionError(42)).toBe(false);
  });
});
