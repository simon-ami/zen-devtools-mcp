/**
 * Error thrown when Zen is not connected or was closed
 * The message is designed to help AI assistants understand what happened
 * and what action to take.
 */
export class ZenDisconnectedError extends Error {
  constructor(reason?: string) {
    const baseMessage = 'Zen browser is not connected';
    const instruction =
      'The Zen browser window was closed. ' +
      'Use the restart_zen tool with zenPath parameter to start a new Zen instance. ' +
      'Example: restart_zen with zenPath="/Applications/Zen.app/Contents/MacOS/zen"';

    const fullMessage = reason
      ? `${baseMessage}: ${reason}. ${instruction}`
      : `${baseMessage}. ${instruction}`;

    super(fullMessage);
    this.name = 'ZenDisconnectedError';
  }
}

export { ZenDisconnectedError as FirefoxDisconnectedError };

/**
 * Check if an error indicates browser disconnection
 */
export function isDisconnectionError(error: unknown): boolean {
  if (error instanceof ZenDisconnectedError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Common Selenium/WebDriver disconnection error patterns
    return (
      message.includes('session deleted') ||
      message.includes('session not created') ||
      message.includes('no such window') ||
      message.includes('no such session') ||
      message.includes('target window already closed') ||
      message.includes('unable to connect') ||
      message.includes('connection refused') ||
      message.includes('not connected') ||
      message.includes('driver not connected') ||
      message.includes('invalid session id') ||
      message.includes('browsing context has been discarded')
    );
  }

  return false;
}
