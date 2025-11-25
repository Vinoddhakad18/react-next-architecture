/**
 * TokenManager
 * Centralized token management for authentication with security enhancements
 *
 * SECURITY IMPROVEMENTS:
 * - Uses SecureStorage with sessionStorage + memory storage
 * - Implements token obfuscation (basic protection)
 * - Auto-cleanup on tab close
 *
 * PRODUCTION RECOMMENDATION:
 * - Use httpOnly cookies for refresh tokens
 * - Store access tokens in memory only with short expiration
 * - Implement proper CSRF protection
 * - Add Content Security Policy headers
 */

import { STORAGE_KEYS } from '@/constants';
import { secureStorage } from './SecureStorage';

export class TokenManager {
  private static instance: TokenManager;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Check if code is running in browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Set access token (stored in sessionStorage + memory)
   */
  setToken(token: string): void {
    if (!this.isBrowser()) return;
    secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Set refresh token (stored in sessionStorage + memory)
   * SECURITY: In production, this should be an httpOnly cookie
   */
  setRefreshToken(token: string): void {
    if (!this.isBrowser()) return;
    secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    return secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Clear all tokens from all storage locations
   */
  clearTokens(): void {
    if (!this.isBrowser()) return;
    secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Enable memory-only mode for maximum security
   * NOTE: Tokens will be lost on page refresh
   */
  setMemoryOnlyMode(enabled: boolean): void {
    secureStorage.setMemoryOnlyMode(enabled);
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
