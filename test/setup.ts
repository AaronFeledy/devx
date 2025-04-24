import { expect, mock } from 'bun:test';
import { afterEach } from 'bun:test';

// Make expect available globally
globalThis.expect = expect;

// Clean up mocks after each test
afterEach(() => {
  // Bun's mock.reset() is not available in this environment. Clear or reset mocks in each test file as needed.
});
