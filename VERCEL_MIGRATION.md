# Vercel Migration Guide

This guide will help you migrate your MAPIM Strategic Centre app from Docker deployment to Vercel hosting.

## 📋 Pre-Migration Checklist

- ✅ Next.js config updated (removed `output: standalone`)
- ✅ Environment variables template created (`env.template`)
- ✅ Vercel configuration file created (`vercel.json`)
- ✅ Build process tested locally
- ✅ Package.json scripts updated

## 🚀 Migration Steps

### Step 1: Prepare Repository

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel migration"
   git push
   ```

### Step 2: Connect to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**: `apitlekays/thenewsiagaxbencana`
4. **Vercel will auto-detect Next.js** - no configuration needed

### Step 3: Configure Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zdleickljellmrlqeyee.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.32` | Production, Preview, Development |

### Step 4: Deploy

1. **Click "Deploy"** in Vercel dashboard
2. **Wait for build to complete** (~2-3 minutes)
3. **Test the deployment** using the provided Vercel URL

### Step 5: Configure Custom Domain (Optional)

1. **Go to Settings → Domains**
2. **Add your custom domain**
3. **Update DNS records** as instructed by Vercel
4. **Wait for SSL certificate** (automatic)

## 🔧 Configuration Details

### Vercel Configuration (`vercel.json`)

- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Function Timeout**: 30 seconds (for API routes)
- **Region**: Singapore (`sin1`) for optimal performance
- **Security Headers**: Maintained from original config

### Environment Variables

All environment variables are prefixed with `NEXT_PUBLIC_` for client-side access:
- Supabase configuration for database access
- App version for display purposes
- Node environment automatically set by Vercel

## 🧪 Testing Checklist

After deployment, verify:

- [ ] **Homepage loads** correctly
- [ ] **Vessel tracking page** (`/sumudnusantara`) works
- [ ] **API routes** respond correctly:
  - [ ] `/api/vessels` returns vessel data
  - [ ] `/api/met_thunderain` returns weather data
- [ ] **Timeline** shows latest data (September 15th)
- [ ] **Map interactions** work properly
- [ ] **Mobile responsiveness** maintained
- [ ] **Performance** is acceptable

## 🔄 GitHub Actions Integration

Your existing GitHub Actions workflow will continue to work:

- **Cron job** runs every 15 minutes
- **Edge Function** fetches data from GSF API
- **Database** stays updated automatically
- **No changes needed** to the data pipeline

## 📊 Performance Optimizations

Vercel provides several automatic optimizations:

- **Edge Network**: Global CDN for static assets
- **Image Optimization**: Automatic WebP conversion
- **Code Splitting**: Automatic bundle optimization
- **Caching**: Intelligent caching strategies
- **Compression**: Automatic gzip/brotli compression

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables are set correctly
   - Verify all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

2. **API Route Timeouts**:
   - Increase timeout in `vercel.json` if needed
   - Optimize data fetching logic
   - Consider upgrading to Vercel Pro

3. **Environment Variables**:
   - Ensure all `NEXT_PUBLIC_` variables are set
   - Check variable names match exactly
   - Verify values are correct

### Debug Commands

```bash
# Test build locally
npm run build

# Test production build
npm run start

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

## 💰 Cost Comparison

| Feature | Docker Hosting | Vercel Hobby | Vercel Pro |
|---------|---------------|-------------|------------|
| **Cost** | $5-20/month | Free | $20/month |
| **Bandwidth** | Unlimited | 100GB | Unlimited |
| **Build Time** | Unlimited | 100GB-hours | 1000GB-hours |
| **Function Executions** | Unlimited | 100GB-hours | 1000GB-hours |
| **Team Members** | 1 | 1 | Unlimited |

## 🔄 Rollback Plan

If you need to rollback to Docker:

1. **Keep Docker files** (they're still in the repo)
2. **Revert Next.js config**:
   ```typescript
   const nextConfig: NextConfig = {
     output: 'standalone', // Add this back
     // ... rest of config
   };
   ```
3. **Redeploy with Docker**:
   ```bash
   npm run docker:build
   npm run docker:up
   ```

## 📞 Support

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **Community Support**: https://github.com/vercel/vercel/discussions

## ✅ Post-Migration Tasks

1. **Update DNS** to point to Vercel
2. **Test all functionality** thoroughly
3. **Monitor performance** in Vercel dashboard
4. **Set up monitoring** and alerts
5. **Update documentation** with new URLs
6. **Inform users** of any URL changes

---

**Migration Estimated Time**: 1-2 hours
**Difficulty Level**: ⭐⭐☆☆☆ (Very Easy)
**Success Rate**: 95%+ (Next.js apps migrate smoothly to Vercel)
