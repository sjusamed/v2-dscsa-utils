# Deploy to Vercel - Quick Guide

## Method 1: Using Vercel CLI (Recommended)

### Step 1: Login to Vercel
```bash
vercel login
```
This will open your browser to authenticate.

### Step 2: Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → dscsa-web-scanner (or press Enter)
- **In which directory is your code located?** → ./ (press Enter)
- **Want to override settings?** → No

### Step 3: Add Environment Variables

After first deployment, add your Supabase credentials:

```bash
vercel env add VITE_SUPABASE_URL
```
Paste your Supabase URL when prompted.

```bash
vercel env add VITE_SUPABASE_ANON_KEY
```
Paste your Supabase anon key when prompted.

### Step 4: Redeploy with Environment Variables
```bash
vercel --prod
```

Your app is now live! 🎉

---

## Method 2: Using Vercel Dashboard (Alternative)

### Step 1: Push to GitHub
```bash
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/dscsa-web-scanner.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Vite settings
4. Click **"Environment Variables"**
5. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy**

Done! Your app will be live at `https://dscsa-web-scanner.vercel.app` (or similar)

---

## Vercel Configuration (Already Optimal)

Your `vite.config.js` and `package.json` are already set up correctly for Vercel:
- Build command: `npm run build` (creates `dist/` folder)
- Output directory: `dist/`
- Framework: Vite (auto-detected)

---

## After Deployment

### Custom Domain (Optional)
1. Go to your project in Vercel Dashboard
2. Settings → Domains
3. Add your custom domain

### Update Environment Variables
1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Edit/Add variables
4. Redeploy from Deployments tab

---

## Troubleshooting

### "Environment variables not working"
- Make sure they start with `VITE_` prefix
- Redeploy after adding env vars: `vercel --prod`

### "Build failed"
- Check that `npm run build` works locally first
- Verify all dependencies are in `package.json`

### "Supabase connection error"
- Verify env vars are set correctly in Vercel
- Check Supabase project is active
- Verify RLS policies allow access
