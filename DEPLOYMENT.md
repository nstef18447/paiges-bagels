# Deployment Checklist

Follow these steps to deploy Paige's Bagels ordering system.

## Pre-Deployment Setup

### 1. Supabase Database Setup

- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project
- [ ] Copy project URL and keys
- [ ] Run `database/schema.sql` in Supabase SQL Editor
- [ ] Verify tables created: `time_slots`, `orders`
- [ ] Verify function created: `get_slot_capacity`
- [ ] Enable Realtime for `orders` table (Project Settings > API > Realtime)

### 2. Resend Email Setup

- [ ] Create Resend account at https://resend.com
- [ ] Add and verify your domain (or use testing domain for development)
- [ ] Copy API key
- [ ] Test email sending from Resend dashboard

### 3. Environment Variables

Create `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
RESEND_API_KEY=re_your-api-key
ADMIN_PASSWORD=choose-a-strong-password
NEXT_PUBLIC_VENMO_USERNAME=your-venmo-username
```

- [ ] All environment variables configured
- [ ] Verified Supabase connection works
- [ ] Verified Resend API key works

## Local Testing

### 1. Test Customer Flow

- [ ] Run `npm run dev`
- [ ] Create a test time slot via admin panel
- [ ] Place test order
- [ ] Verify order appears in admin dashboard
- [ ] Verify Venmo link generated correctly

### 2. Test Admin Flow

- [ ] Navigate to `/admin`
- [ ] Login with admin password
- [ ] Create time slots for upcoming dates
- [ ] Verify time slots show capacity correctly
- [ ] Test confirming a pending order
- [ ] Verify confirmation email sent (check Resend dashboard)
- [ ] Test marking order ready
- [ ] Verify ready email sent

### 3. Test Edge Cases

- [ ] Try ordering more bagels than slot capacity
- [ ] Try ordering any quantity from 1-6 bagels (all should work)
- [ ] Verify real-time updates work (open admin in two tabs)

## Deployment to Vercel

### 1. Prepare Repository

- [ ] Initialize git repository: `git init`
- [ ] Commit all files: `git add . && git commit -m "Initial commit"`
- [ ] Push to GitHub

### 2. Vercel Setup

- [ ] Create Vercel account at https://vercel.com
- [ ] Import your GitHub repository
- [ ] Configure project settings:
  - Framework Preset: Next.js
  - Root Directory: ./
  - Build Command: `npm run build` (default)
  - Output Directory: `.next` (default)

### 3. Add Environment Variables in Vercel

Go to Project Settings > Environment Variables and add:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `ADMIN_PASSWORD`
- [ ] `NEXT_PUBLIC_VENMO_USERNAME`

Make sure all are set for Production, Preview, and Development environments.

### 4. Deploy

- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Visit deployment URL

## Post-Deployment Testing

- [ ] Test customer order flow on production URL
- [ ] Test admin login on production
- [ ] Verify emails are sent (use real email address)
- [ ] Test Venmo link opens correctly
- [ ] Check Supabase logs for any errors
- [ ] Monitor Vercel logs for issues

## Production Checklist

### Email Configuration

- [ ] Update Resend "from" email in `lib/email.ts` to use your verified domain
- [ ] Example: Change `from: 'Paige\'s Bagels <onboarding@resend.dev>'`
- [ ] To: `from: 'Paige\'s Bagels <orders@yourdomain.com>'`

### Security

- [ ] Strong admin password set
- [ ] Supabase RLS policies enabled and tested
- [ ] Environment variables secured in Vercel
- [ ] No sensitive data in client-side code

### Initial Data

- [ ] Create time slots for the first week
- [ ] Test with a real order
- [ ] Verify payment workflow with real Venmo account

## Monitoring and Maintenance

### Daily Tasks

- [ ] Check pending orders in admin dashboard
- [ ] Confirm payments received via Venmo
- [ ] Mark orders ready for pickup
- [ ] Create time slots for upcoming days

### Weekly Tasks

- [ ] Review Supabase database usage
- [ ] Check Resend email quota
- [ ] Monitor Vercel analytics

### Backup

- [ ] Set up regular database backups in Supabase
- [ ] Export order data periodically for records

## Troubleshooting

### Common Issues

**Problem**: Orders not appearing in admin
- Check Supabase connection
- Verify RLS policies are correct
- Check browser console for errors

**Problem**: Emails not sending
- Verify Resend API key
- Check Resend dashboard for failed emails
- Verify email addresses are valid

**Problem**: Capacity not updating
- Check `get_slot_capacity` function in Supabase
- Verify orders are correctly linked to time slots

**Problem**: Admin login not working
- Verify `ADMIN_PASSWORD` environment variable
- Check browser cookies are enabled
- Clear cookies and try again

## Support

For issues or questions:
- Check Supabase logs
- Check Vercel deployment logs
- Review Resend email logs
