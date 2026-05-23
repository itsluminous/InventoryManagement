# CI/CD Setup Guide

## GitHub Secrets Configuration

To make the CI/CD pipeline work properly, you need to add the following secrets to your GitHub repository:

### Required Secrets

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL"
   - Add this as a GitHub secret

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - In the same Supabase API settings page
   - Copy the "anon public" key
   - Add this as a GitHub secret

### How to Add GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the exact name and value

### Testing the Setup

After adding the secrets:

1. Push a commit to trigger the CI pipeline
2. Check the "Actions" tab to see if the build passes
3. The build should now complete successfully

### Local Development

For local development, make sure you have a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Troubleshooting

If the build still fails:

1. Check that the secret names match exactly (case-sensitive)
2. Verify the Supabase URL and key are correct
3. Check the Actions logs for specific error messages

## Changes Made

The following changes were made to fix the CI build issues:

1. **Updated CI workflow** to include Supabase environment variables
2. **Enhanced Supabase clients** to handle missing environment variables gracefully
3. **Added fallback values** in Next.js config for build-time
4. **Improved error handling** for missing credentials

These changes ensure the build works both locally and in CI environments.
