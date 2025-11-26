# CSRF Protection Implementation Guide

## Overview

This application implements comprehensive CSRF (Cross-Site Request Forgery) protection using a double-submit cookie pattern with server-side validation. All state-changing operations (POST, PUT, PATCH, DELETE) are protected against CSRF attacks.

## Architecture

### Components

1. **CSRF Token Generation** ([lib/utils/csrf.ts](src/lib/utils/csrf.ts))
   - Generates cryptographically secure random tokens
   - Hashes tokens with secrets for validation
   - Provides client-side cookie reading utilities

2. **Middleware** ([middleware.ts](src/middleware.ts))
   - Automatically generates CSRF tokens for authenticated users
   - Sets three cookies:
     - `csrf-token` (httpOnly: false) - Read by client JavaScript
     - `csrf-token-hash` (httpOnly: true) - Server-side verification
     - `csrf-secret` (httpOnly: true) - Server-side verification

3. **API Client** ([lib/api/client.ts](src/lib/api/client.ts))
   - Automatically includes CSRF tokens in request headers
   - Adds `X-CSRF-Token` header to all POST/PUT/PATCH/DELETE requests

4. **Server Validation** ([lib/utils/validateCsrf.ts](src/lib/utils/validateCsrf.ts))
   - Validates CSRF tokens on the server side
   - Provides utilities for API route protection

## How It Works

### 1. Token Generation
When an authenticated user accesses the application:
- Middleware checks for existing CSRF token
- If missing, generates new token + secret
- Hashes token with secret for validation
- Sets three cookies

### 2. Client Requests
For state-changing requests (POST/PUT/PATCH/DELETE):
- API client reads `csrf-token` from cookie
- Includes token in `X-CSRF-Token` header
- Sends request to server

### 3. Server Validation
On the server side:
- API route extracts `X-CSRF-Token` from headers
- Reads `csrf-token-hash` and `csrf-secret` from httpOnly cookies
- Validates token by re-hashing and comparing
- Rejects request if validation fails

## Usage

### For API Routes

Use the validation utilities in your API routes:

```typescript
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrfValidation = validateCsrfFromRequest(request);

  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  // Continue with your logic...
  return NextResponse.json({ success: true });
}
```

### For Standard Request API

If using the standard Request API:

```typescript
import { validateCsrfFromStandardRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';

export async function POST(request: Request) {
  const csrfValidation = await validateCsrfFromStandardRequest(request);

  if (!csrfValidation.isValid) {
    return createCsrfErrorResponse();
  }

  // Continue with your logic...
}
```

### Client-Side Usage

The API client automatically handles CSRF tokens. No additional code needed:

```typescript
import { authService } from '@/services/auth.service';

// CSRF token is automatically included
await authService.logout();
```

### Manual Token Retrieval

If you need to manually get a CSRF token:

```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api';

const response = await apiClient.get(API_ENDPOINTS.CSRF);
// Token is automatically set in cookies
```

## Security Features

### Double-Submit Cookie Pattern
- Token sent in both cookie and header
- Prevents CSRF because attackers can't read cookies from other domains
- Even if an attacker tricks a user into submitting a form, they can't include the header

### Server-Side Hashing
- Raw token never stored on server
- Token hashed with secret before storage
- Prevents token theft from server-side logs

### Timing-Safe Comparison
- Uses constant-time comparison to prevent timing attacks
- Attackers can't deduce token values from response times

### Secure Cookie Options
- `httpOnly: true` for hash and secret (not accessible to JavaScript)
- `secure: true` in production (HTTPS only)
- `sameSite: 'strict'` (prevents cross-site cookie sending)
- 24-hour expiration

## Configuration

### Cookie Settings

Modify cookie options in:
- [middleware.ts](src/middleware.ts) (lines 23-47)
- [app/api/csrf/route.ts](src/app/api/csrf/route.ts) (lines 19-45)

### Token Length

Adjust in [lib/utils/csrf.ts](src/lib/utils/csrf.ts):
```typescript
const CSRF_TOKEN_LENGTH = 32;  // 32 bytes = 256 bits
const CSRF_SECRET_LENGTH = 64; // 64 bytes = 512 bits
```

## Example Implementation

See the example logout route: [app/api/v1/auth/logout/route.ts](src/app/api/v1/auth/logout/route.ts)

This demonstrates:
- CSRF validation
- Error handling
- Cookie cleanup
- Proper response format

## Testing CSRF Protection

### Valid Request
```bash
# Get CSRF token first
curl -c cookies.txt http://localhost:3000/api/csrf

# Extract token from cookie
TOKEN=$(grep csrf-token cookies.txt | awk '{print $7}')

# Make authenticated request with token
curl -b cookies.txt \
  -H "X-CSRF-Token: $TOKEN" \
  -X POST http://localhost:3000/api/v1/auth/logout
```

### Invalid Request (Should Fail)
```bash
# Without CSRF token
curl -X POST http://localhost:3000/api/v1/auth/logout
# Returns: 403 Forbidden - CSRF validation failed
```

## Best Practices

1. **Always Validate**: Add CSRF validation to ALL state-changing endpoints
2. **Don't Skip**: Never disable CSRF protection, even for "internal" APIs
3. **Rotate Tokens**: Consider rotating tokens periodically for high-security operations
4. **Log Failures**: Monitor CSRF validation failures for potential attacks
5. **Error Messages**: Don't reveal token format or validation logic in error messages

## Migration Guide

To add CSRF protection to existing API routes:

1. Import validation utilities:
   ```typescript
   import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
   ```

2. Add validation at the start of your handler:
   ```typescript
   const csrfValidation = validateCsrfFromRequest(request);
   if (!csrfValidation.isValid) {
     return createCsrfErrorResponse();
   }
   ```

3. Test thoroughly to ensure client requests include the token

## Troubleshooting

### "CSRF validation failed" errors

1. **Check cookies are set**: Open DevTools → Application → Cookies
   - Should see: `csrf-token`, `csrf-token-hash`, `csrf-secret`

2. **Check request headers**: Open DevTools → Network → Request Headers
   - Should see: `X-CSRF-Token: [token]`

3. **Verify token matches**: The `X-CSRF-Token` header should match the `csrf-token` cookie value

### Token not being sent

- Ensure user is authenticated (middleware only sets token for auth users)
- Check that request is POST/PUT/PATCH/DELETE (not GET)
- Verify API client is being used (not raw fetch)

## Security Considerations

### What CSRF Protection Prevents
- ✅ Unauthorized state changes from malicious sites
- ✅ Clickjacking attacks that submit forms
- ✅ Cross-origin request forgery

### What It Doesn't Prevent
- ❌ XSS (Cross-Site Scripting) - Use Content Security Policy
- ❌ SQL Injection - Use parameterized queries
- ❌ Authentication bypass - Use proper auth tokens
- ❌ CORS issues - Configure CORS separately

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
