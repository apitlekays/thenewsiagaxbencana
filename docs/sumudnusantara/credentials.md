# ⚠️ SECURITY NOTICE - CREDENTIALS REMOVED

**Last updated: 2025-01-19**

This file previously contained sensitive credentials that have been **REMOVED** for security reasons.

## ⚠️ IMMEDIATE ACTION REQUIRED

If you were using the credentials from this file, you **MUST**:

1. **Rotate all exposed keys immediately** in your Supabase and GSF API dashboards
2. **Update your environment variables** with the new credentials
3. **Never commit sensitive data** to version control

## Environment Variables Setup

All credentials have been moved to environment variables. See:
- `docs/environment-variables.md` - Complete setup guide
- `.env.local` - For local development (create from template)

## Required Environment Variables

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

### GSF API
- `GSF_API_URL`
- `GSF_API_TOKEN`

### Maps
- `STADIA_MAPS_STYLE_URL`

## Security Best Practices

- ✅ Use environment variables for all secrets
- ✅ Rotate keys regularly
- ✅ Never commit `.env.local` or `.env` files
- ✅ Use different keys for development/staging/production
- ✅ Monitor for unauthorized access

## Getting New Credentials

1. **Supabase**: Go to Project Settings → API → Generate new keys
2. **GSF API**: Contact API provider for new token
3. **Vercel**: Update environment variables in project settings

---

**This file is kept as a reminder of the security incident and proper credential management.**