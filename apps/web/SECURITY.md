# Security Guide

## Open Redirect Prevention

### Vulnerability

Open redirect vulnerabilities occur when an application redirects users to a URL specified in an untrusted parameter without validation. Attackers can exploit this for phishing attacks.

**Attack Example:**
```
https://yourapp.com/login?redirect=https://evil.com/fake-login
```

After login, user is redirected to attacker's site that looks identical to your app.

### Current Protection

The application implements **strict redirect validation**:

#### 1. Redirect Validation Utility ([lib/utils/redirectValidation.ts](src/lib/utils/redirectValidation.ts))

```typescript
// Validates and sanitizes redirect URLs
const safeRedirect = getSafeRedirect(userProvidedUrl, '/default');
```

**Security Checks:**
- ✅ Only allows relative paths (must start with `/`)
- ✅ Blocks absolute URLs (`http://`, `https://`, `//`)
- ✅ Blocks protocol handlers (`javascript:`, `data:`, `file:`)
- ✅ Validates against allowlist of known routes
- ✅ URL decoding to prevent encoded attacks
- ✅ Blocks path traversal attempts (`//`, `\\`)

#### 2. Protected Routes

Only these paths are allowed for redirects:
- `/admin/dashboard`
- `/admin/users`
- `/admin/settings`
- `/admin/profile`
- All routes in `PROTECTED_ROUTES` constant

#### 3. Login Page ([app/admin/login/page.tsx](src/app/admin/login/page.tsx:72-73))

```typescript
// BEFORE (Vulnerable)
const redirect = searchParams?.get('redirect') || '/admin/dashboard';
router.push(redirect); // ❌ CRITICAL

// AFTER (Secure)
const requestedRedirect = searchParams?.get('redirect');
const safeRedirect = getSafeRedirect(requestedRedirect, '/admin/dashboard');
router.push(safeRedirect); // ✅ SAFE
```

### Best Practices

1. **Never trust user input** for redirects
2. **Use allowlists** instead of blocklists
3. **Validate on both client and server**
4. **Log suspicious redirect attempts**
5. **Use relative paths only** when possible

## Route Protection

### The Problem with Client-Side Only Protection

❌ **Client-side checks are easily bypassed:**

```typescript
// VULNERABLE: Client-side only
'use client'
useEffect(() => {
  if (!authService.isAuthenticated()) {
    router.push('/admin/login'); // ❌ Can be bypassed
  }
}, []);
```

**Attack vectors:**
- Disable JavaScript → Access protected content
- React DevTools → Manipulate state
- Direct URL access → Content renders before redirect
- SSR content leak → Server renders page before client check

### Proper Multi-Layer Protection

The application implements **defense in depth** with multiple security layers:

#### Layer 1: Next.js Middleware (Server-Side) ⭐ PRIMARY

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;

  if (isProtectedRoute(pathname) && !token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}
```

**Benefits:**
- ✅ Runs on server before page renders
- ✅ Works with JavaScript disabled
- ✅ No content leakage
- ✅ Cannot be bypassed
- ✅ Fastest protection (edge runtime)

#### Layer 2: Server Components (Server-Side)

```typescript
// Server Component
import { requireServerAuth } from '@/lib/auth/serverAuth';

export default async function ProtectedPage() {
  await requireServerAuth(); // Redirects if not authenticated

  return <div>Protected content</div>;
}
```

**Benefits:**
- ✅ Server-side validation
- ✅ No client-side rendering of protected data
- ✅ Type-safe with async/await

#### Layer 3: API Route Protection (Server-Side)

```typescript
// app/api/protected/route.ts
import { getServerAuthToken } from '@/lib/auth/serverAuth';

export async function GET() {
  const token = await getServerAuthToken();

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return protected data
}
```

### Implementation Examples

#### Protected Page Pattern

```typescript
// ✅ SECURE: Middleware handles protection
'use client';

export default function AdminDashboard() {
  // No authentication check needed!
  // Middleware ensures only authenticated users reach here

  return <div>Dashboard content</div>;
}
```

#### Server Component with Data Fetching

```typescript
// ✅ SECURE: Server-side auth + data fetching
import { requireServerAuth } from '@/lib/auth/serverAuth';

export default async function ProfilePage() {
  const token = await requireServerAuth();

  // Fetch user data server-side
  const userData = await fetch('/api/user', {
    headers: { Authorization: `Bearer ${token}` }
  });

  return <div>{/* Render user data */}</div>;
}
```

### Current Protection Status

| Route | Middleware | Server Component | Client Component | Status |
|-------|-----------|------------------|------------------|--------|
| `/admin/dashboard` | ✅ Protected | N/A | Simplified | ✅ Secure |
| `/admin/users` | ✅ Protected | N/A | N/A | ✅ Secure |
| `/admin/settings` | ✅ Protected | N/A | N/A | ✅ Secure |
| `/admin/login` | ✅ Redirect if auth | N/A | Open Redirect Fixed | ✅ Secure |

### Security Checklist: Route Protection

- [x] Middleware protects all `/admin/*` routes
- [x] Server-side authentication utilities available
- [x] Client-side redundant checks removed
- [x] Cookies set for middleware validation
- [x] SessionStorage used for client-side state
- [ ] Server Components for sensitive data (recommended)
- [ ] API route authentication middleware

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

#### 3. Implement CSRF Protection ✅ IMPLEMENTED

The application now includes comprehensive CSRF protection using the double-submit cookie pattern:

```typescript
// Automatic CSRF token inclusion (handled by API client)
import { authService } from '@/services/auth.service';
await authService.logout(); // CSRF token automatically included

// Manual API route protection
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

export async function POST(request: NextRequest) {
  const csrfValidation = validateCsrfFromRequest(request);
  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }
  // Continue with protected logic...
}
```

**See [CSRF_IMPLEMENTATION.md](CSRF_IMPLEMENTATION.md) for complete documentation.**

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

## CSRF Protection

### Overview

The application implements **comprehensive CSRF (Cross-Site Request Forgery) protection** using the double-submit cookie pattern with server-side validation. All state-changing operations (POST, PUT, PATCH, DELETE) are protected against CSRF attacks.

### Implementation

#### Automatic Protection

The API client automatically includes CSRF tokens in all state-changing requests:

```typescript
import { authService } from '@/services/auth.service';

// CSRF token is automatically included in the request headers
await authService.logout();
```

#### Manual API Route Protection

For custom API routes, use the validation utilities:

```typescript
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrfValidation = validateCsrfFromRequest(request);

  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  // Continue with your protected logic...
  return Response.json({ success: true });
}
```

### How It Works

1. **Token Generation**: Middleware automatically generates CSRF tokens for authenticated users
2. **Token Storage**: Three cookies are set:
   - `csrf-token` (readable by JavaScript) - Sent in request headers
   - `csrf-token-hash` (httpOnly) - Used for server validation
   - `csrf-secret` (httpOnly) - Used for server validation
3. **Automatic Inclusion**: API client reads the token and includes it in `X-CSRF-Token` header
4. **Server Validation**: API routes validate the token before processing requests

### Security Features

- ✅ Double-submit cookie pattern prevents CSRF attacks
- ✅ Server-side token hashing prevents token theft
- ✅ Timing-safe comparison prevents timing attacks
- ✅ Secure cookie options (httpOnly, secure, sameSite)
- ✅ 24-hour token expiration

### Files and Components

- **Token Utilities**: [lib/utils/csrf.ts](src/lib/utils/csrf.ts)
- **Validation Utilities**: [lib/utils/validateCsrf.ts](src/lib/utils/validateCsrf.ts)
- **Middleware**: [middleware.ts](src/middleware.ts)
- **API Client**: [lib/api/client.ts](src/lib/api/client.ts)
- **Example Route**: [app/api/v1/auth/logout/route.ts](src/app/api/v1/auth/logout/route.ts)

### Complete Documentation

For complete implementation details, usage examples, and troubleshooting:
👉 **See [CSRF_IMPLEMENTATION.md](CSRF_IMPLEMENTATION.md)**

### What CSRF Protection Prevents

- ✅ Unauthorized state changes from malicious sites
- ✅ Clickjacking attacks that submit forms
- ✅ Cross-origin request forgery

### Security Checklist: CSRF Protection

- [x] CSRF token generation utility created
- [x] CSRF validation utility created
- [x] Middleware generates tokens for authenticated users
- [x] API client includes tokens in state-changing requests
- [x] Example protected API route created
- [x] Secure cookie configuration
- [x] Server-side validation implemented
- [x] Comprehensive documentation provided

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

### Token Storage
- [x] Tokens in sessionStorage (not localStorage)
- [x] Token obfuscation implemented
- [x] Auto-cleanup on tab close
- [ ] httpOnly cookies for refresh tokens (Backend required)

### Open Redirect Prevention
- [x] Redirect URL validation utility
- [x] Allowlist-based validation
- [x] Absolute URL blocking
- [x] Protocol handler blocking
- [x] Path traversal prevention

### Route Protection
- [x] Next.js middleware enforces auth
- [x] Server-side token validation
- [x] Cookie-based middleware checks
- [x] Client redundant checks removed
- [x] Server auth utilities created
- [ ] Server Components for sensitive data

### General Security
- [x] Enhanced security headers
- [ ] Content Security Policy headers
- [x] CSRF protection (Double-submit cookie pattern)
- [ ] Rate limiting
- [ ] Security event logging
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
