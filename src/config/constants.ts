import { BROWSER } from './browser.js';

declare const __SERVER_NAME__: string | undefined;
declare const __SERVER_VERSION__: string | undefined;

export const SERVER_NAME =
  typeof __SERVER_NAME__ !== 'undefined' ? __SERVER_NAME__ : BROWSER.serverName;
export const SERVER_VERSION =
  typeof __SERVER_VERSION__ !== 'undefined' ? __SERVER_VERSION__ : 'dev';
