# Menu API Debugging Guide

## Issue: Menu page not working at http://localhost:4200/admin/menus

## Potential Issues and Solutions

### 1. **Backend API Not Running**
The API route proxies to `http://localhost:3000/api/v1/menus`. Make sure:
- Backend API is running on port 3000
- Or set `BACKEND_API_URL` environment variable to the correct URL

### 2. **Authentication Token Missing**
The API requires an `authToken` cookie. Check:
- Are you logged in? Visit `/admin/login` first
- Check browser DevTools → Application → Cookies for `authToken`
- The token should be set after login

### 3. **API Key Configuration**
The API route uses:
- `API_KEY` or `NEXT_PUBLIC_API_KEY` environment variable
- Default: `czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=`

### 4. **Response Format Mismatch**
The backend should return:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Menu Name",
      "slug": "menu-slug",
      "sortOrder": 1,
      "isActive": true,
      ...
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Debugging Steps

1. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console for errors
   - Check Network tab for API calls

2. **Check Server Logs**
   - Look for `[Menu API]` log messages
   - Check for fetch errors or backend connection issues

3. **Test API Directly**
   ```bash
   curl -X 'GET' \
     'http://localhost:4200/api/v1/menus?page=1&limit=10&sortBy=sort_order&sortOrder=ASC' \
     -H 'accept: application/json' \
     -H 'Cookie: authToken=YOUR_TOKEN'
   ```

4. **Check Environment Variables**
   - Create/check `.env.local` in `apps/web/`:
     ```
     BACKEND_API_URL=http://localhost:3000
     API_KEY=czVtZWFyY2hfa2V5LHRlc3Rfa2V5XzEyMyxkZXZfdGVzdF9rZXk=
     NEXT_PUBLIC_API_URL=http://localhost:4200
     ```

5. **Verify Authentication**
   - Make sure you're logged in
   - Check that `authToken` cookie exists
   - Token should be a valid JWT

## Common Errors

### "Unauthorized" (401)
- **Cause**: Missing or invalid `authToken` cookie
- **Solution**: Log in at `/admin/login`

### "Failed to connect to backend API" (503)
- **Cause**: Backend API not running or wrong URL
- **Solution**: Start backend API or set correct `BACKEND_API_URL`

### "Failed to fetch menus"
- **Cause**: Backend API returned an error
- **Solution**: Check backend API logs and response

### Empty page / No data
- **Cause**: Backend returned empty array or wrong format
- **Solution**: Check backend response format matches `MenuListResponse`

## Testing the API Route Directly

1. **With Authentication Cookie**:
   ```bash
   # Get token from browser cookies after login
   curl -X GET 'http://localhost:4200/api/v1/menus?page=1&limit=10' \
     -H 'Cookie: authToken=YOUR_TOKEN_HERE'
   ```

2. **Check Response Format**:
   The response should be:
   ```json
   {
     "data": [...],
     "meta": {...}
   }
   ```

## Next Steps

1. Check browser console for errors
2. Check server terminal for `[Menu API]` logs
3. Verify backend API is running
4. Verify authentication token exists
5. Test API endpoint directly with curl






