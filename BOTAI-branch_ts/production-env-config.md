# Production Environment Configuration for Authentication Fix

## Required Environment Variables

Set these environment variables in your production deployment:

### Core Authentication Variables
```
NODE_ENV=production
SESSION_SECRET=your-secure-random-32-character-string
```

### Cookie Configuration Variables
```
COOKIE_SECURE=true
COOKIE_DOMAIN=.your-domain.com
```

### Database Variables
```
DATABASE_URL=postgresql://username:password@host:port/database
```

## Platform-Specific Configuration

### Replit Deployments
1. Go to your deployed project
2. Navigate to "Secrets" tab
3. Add the environment variables listed above

### Vercel
1. Project Settings → Environment Variables
2. Add variables for Production environment

### Heroku
```bash
heroku config:set SESSION_SECRET=your-secret
heroku config:set COOKIE_DOMAIN=.your-app.herokuapp.com
```

### Railway
1. Project → Variables tab
2. Add environment variables

## Authentication Issue Fixes Applied

1. **Trust Proxy Configuration**: Added `app.set('trust proxy', 1)` for production
2. **Flexible Cookie Security**: Allow disabling secure cookies with `COOKIE_SECURE=false`
3. **SameSite Policy**: Set to "none" for production cross-origin requests
4. **Domain Configuration**: Support custom cookie domains
5. **HttpOnly Security**: Enabled for XSS protection

## Testing the Fix

After deploying with new environment variables:

1. Clear browser cookies
2. Login to your production application
3. Check browser dev tools for:
   - Set-Cookie headers in login response
   - Cookie presence in subsequent requests
4. Verify `/api/notifications` returns data instead of 401

## Common Issues and Solutions

### If still getting 401 errors:
- Ensure HTTPS is properly configured
- Check that cookie domain matches your production domain
- Verify SESSION_SECRET is set and consistent

### For cross-origin deployments:
```
COOKIE_SECURE=false
```

### For subdomain deployments:
```
COOKIE_DOMAIN=.yourdomain.com
```

## Security Notes

- Always use HTTPS in production
- Keep SESSION_SECRET secure and unique
- Use strong cookie security settings
- Monitor authentication logs for issues