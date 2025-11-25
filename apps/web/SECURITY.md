# Security Guide

## Token Storage Security

### Current Implementation

The application implements a **multi-layered security approach** for token storage:

1. **SecureStorage Class** ([lib/auth/SecureStorage.ts](src/lib/auth/SecureStorage.ts))
   - Uses `sessionStorage` (cleared on tab close) instead of `localStorage`
   - Implements basic token obfuscation
   - Maintains memory cache for faster access
   - Auto-cleanup on page unload

2. **TokenManager** ([lib/auth/TokenManager.ts](src/lib/auth/TokenManager.ts))
   - Centralized token management
   - Delegates to SecureStorage for all operations
   - Provides memory-only mode option

### Why Not localStorage?

❌ **localStorage is vulnerable to XSS attacks**:
- Tokens persist across sessions
- Accessible by any JavaScript on the page
- No automatic expiration
- Survives browser restarts

✅ **SessionStorage + Memory is better**:
- Cleared when tab closes
- Shorter attack window
- Still accessible by XSS but with limited lifetime

### Production Recommendations

For **production environments**, implement these security measures:

#### 1. Use httpOnly Cookies for Refresh Tokens

```typescript
// Backend: Set httpOnly cookie
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

**Benefits:**
- Not accessible via JavaScript (XSS protection)
- Automatically sent with requests
- Can set secure flags

#### 2. Short-Lived Access Tokens in Memory

```typescript
// Enable memory-only mode for access tokens
tokenManager.setMemoryOnlyMode(true);
```

**Benefits:**
- Lost on page refresh (user re-authenticates)
- No persistent storage vulnerability
- Maximum security

#### 3. Implement CSRF Protection

```typescript
// Add CSRF token to requests
headers: {
  'X-CSRF-Token': csrfToken,
}
```

#### 4. Content Security Policy (CSP)

Add to [next.config.js](next.config.js):

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

#### 5. Token Rotation Strategy

```typescript
// Implement automatic token refresh
setInterval(async () => {
  if (tokenManager.isAuthenticated()) {
    await authService.refreshToken();
  }
}, 14 * 60 * 1000); // Refresh every 14 minutes (15 min token expiry)
```

## XSS Prevention Best Practices

### Input Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user input
const cleanInput = DOMPurify.sanitize(userInput);
```

### Output Encoding

React automatically escapes content, but be careful with:

```typescript
// ❌ DANGEROUS
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ SAFE
<div>{userContent}</div>

// ✅ SAFE (if HTML needed)
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### Validation

```typescript
// Validate on both client and server
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const validated = schema.parse(formData);
```

## API Security

### Request Authentication

```typescript
// TokenManager automatically adds auth headers
const response = await apiClient.get('/api/protected', { auth: true });
```

### Rate Limiting

Implement rate limiting on the backend:

```typescript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Monitoring and Logging

### Security Events to Log

1. Failed login attempts
2. Token refresh failures
3. Unusual API access patterns
4. CSRF token mismatches

### Example

```typescript
// Log security events
console.warn('Failed login attempt', {
  email: credentials.email,
  timestamp: new Date().toISOString(),
  ip: request.ip
});
```

## Migration Path

To upgrade to httpOnly cookies:

1. Update backend to issue httpOnly cookies
2. Remove token storage from frontend
3. Rely on cookies for authentication
4. Update API client to work with cookies
5. Test thoroughly in all environments

## Security Checklist

- [x] Tokens in sessionStorage (not localStorage)
- [x] Token obfuscation implemented
- [x] Auto-cleanup on tab close
- [ ] httpOnly cookies for refresh tokens (Backend required)
- [ ] Content Security Policy headers
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Security event logging
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
