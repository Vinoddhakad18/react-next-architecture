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
    // Note: sessionStorage automatically clears when tab closes
    // Do NOT add beforeunload listener here - it fires on refresh too
    // which would clear tokens during hard/soft refresh
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
   * Set cookie for server-side middleware access
   */
  private setCookie(key: string, value: string): void {
    if (!this.isBrowser()) return;

    try {
      // Set cookie with secure flags
      // Note: This is NOT httpOnly (requires backend), but allows middleware access
      const maxAge = 60 * 60 * 24; // 24 hours
      const isProduction = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
      const secureFlag = isProduction ? '; Secure' : '';
      document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Strict${secureFlag}`;
    } catch (error) {
      console.error('Cookie set error:', error);
    }
  }

  /**
   * Remove cookie
   */
  private removeCookie(key: string): void {
    if (!this.isBrowser()) return;

    try {
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Strict; Secure`;
    } catch (error) {
      console.error('Cookie removal error:', error);
    }
  }

  /**
   * Set item in secure storage
   * Priority: Memory > SessionStorage > Cookie (for middleware)
   */
  setItem(key: string, value: string): void {
    if (!this.isBrowser()) return;

    // Always store in memory
    this.memoryStorage.set(key, value);

    if (this.useMemoryOnly) return;

    try {
      const obfuscated = this.obfuscate(value);

      // 1. Set in sessionStorage (primary storage)
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, obfuscated);
      } else {
        // Fallback to localStorage only if sessionStorage unavailable
        console.warn('SessionStorage unavailable, falling back to localStorage');
        window.localStorage.setItem(key, obfuscated);
      }

      // 2. Set cookie for server-side middleware validation
      // SECURITY: Non-httpOnly cookie, but needed for middleware
      // Production: Use httpOnly cookies set by backend instead
      this.setCookie(key, value);
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
      this.removeCookie(key);
    } catch (error) {
      console.error('Storage removal error:', error);
    }
  }

  /**
   * Clear all stored items
   */
  clearAll(): void {
    if (!this.isBrowser()) return;

    // Clear memory
    this.memoryStorage.forEach((_, key) => {
      this.removeCookie(key);
    });
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
