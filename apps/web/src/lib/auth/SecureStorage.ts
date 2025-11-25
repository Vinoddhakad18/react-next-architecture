/**
 * SecureStorage
 * Provides secure token storage with encryption and XSS protection
 *
 * SECURITY NOTES:
 * - Uses sessionStorage (cleared on tab close) instead of localStorage
 * - Implements basic obfuscation (NOT true encryption without backend key)
 * - RECOMMENDED: Use httpOnly cookies in production for maximum security
 * - This is a mitigation strategy, not a complete solution to XSS
 */

export class SecureStorage {
  private static instance: SecureStorage;
  private memoryStorage: Map<string, string> = new Map();
  private useMemoryOnly: boolean = false;

  private constructor() {
    // Setup cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.clearAll());
    }
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Check if running in browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Simple obfuscation (NOT cryptographic encryption)
   * For true security, tokens should be in httpOnly cookies
   */
  private obfuscate(value: string): string {
    try {
      // Basic Base64 encoding with rotation (obfuscation, not encryption)
      const encoded = btoa(value);
      return encoded.split('').reverse().join('');
    } catch {
      return value;
    }
  }

  /**
   * Decode obfuscated value
   */
  private deobfuscate(value: string): string {
    try {
      const reversed = value.split('').reverse().join('');
      return atob(reversed);
    } catch {
      return value;
    }
  }

  /**
   * Set item in secure storage
   * Priority: Memory > SessionStorage > LocalStorage (fallback)
   */
  setItem(key: string, value: string): void {
    if (!this.isBrowser()) return;

    // Always store in memory
    this.memoryStorage.set(key, value);

    if (this.useMemoryOnly) return;

    try {
      const obfuscated = this.obfuscate(value);

      // Prefer sessionStorage (cleared on tab close)
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, obfuscated);
      } else {
        // Fallback to localStorage only if sessionStorage unavailable
        console.warn('SessionStorage unavailable, falling back to localStorage');
        window.localStorage.setItem(key, obfuscated);
      }
    } catch (error) {
      console.error('Storage error, using memory only:', error);
      this.useMemoryOnly = true;
    }
  }

  /**
   * Get item from secure storage
   * Priority: Memory > SessionStorage > LocalStorage
   */
  getItem(key: string): string | null {
    if (!this.isBrowser()) return null;

    // Check memory first (fastest and most secure)
    const memoryValue = this.memoryStorage.get(key);
    if (memoryValue) return memoryValue;

    try {
      // Check sessionStorage
      let stored = window.sessionStorage?.getItem(key);

      // Fallback to localStorage
      if (!stored) {
        stored = window.localStorage?.getItem(key);
      }

      if (stored) {
        const deobfuscated = this.deobfuscate(stored);
        // Restore to memory
        this.memoryStorage.set(key, deobfuscated);
        return deobfuscated;
      }
    } catch (error) {
      console.error('Storage retrieval error:', error);
    }

    return null;
  }

  /**
   * Remove item from all storage locations
   */
  removeItem(key: string): void {
    if (!this.isBrowser()) return;

    this.memoryStorage.delete(key);

    try {
      window.sessionStorage?.removeItem(key);
      window.localStorage?.removeItem(key);
    } catch (error) {
      console.error('Storage removal error:', error);
    }
  }

  /**
   * Clear all stored items
   */
  clearAll(): void {
    if (!this.isBrowser()) return;

    this.memoryStorage.clear();

    try {
      window.sessionStorage?.clear();
      // Optionally clear localStorage too
      window.localStorage?.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  /**
   * Enable memory-only mode (most secure, but tokens lost on refresh)
   */
  setMemoryOnlyMode(enabled: boolean): void {
    this.useMemoryOnly = enabled;
    if (enabled) {
      // Clear all persistent storage
      try {
        window.sessionStorage?.clear();
        window.localStorage?.clear();
      } catch {
        // Ignore errors
      }
    }
  }
}

export const secureStorage = SecureStorage.getInstance();
