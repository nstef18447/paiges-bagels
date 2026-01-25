# Paige's Bagels - Order Management System

A web-based bagel ordering system with real-time capacity tracking, Venmo payment integration, and email notifications.

## Features

- Customer order form with real-time capacity checking
- Time slot management with capacity limits
- Venmo payment integration
- Email notifications (order confirmation & pickup ready)
- Admin dashboard for order management
- Real-time updates using Supabase subscriptions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Hosting**: Vercel

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to the SQL Editor and run the schema from `database/schema.sql`
4. Get your API keys from Settings > API

### 3. Resend Setup

1. Create a Resend account at [resend.com](https://resend.com)
2. Verify your domain (or use the testing domain for development)
3. Get your API key from API Keys section

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Resend Configuration
RESEND_API_KEY=your_resend_api_key

# Admin Configuration
ADMIN_PASSWORD=your_admin_password

# Venmo Configuration
NEXT_PUBLIC_VENMO_USERNAME=your_venmo_username
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the customer order form.

## Usage

### Customer Flow

1. Visit the homepage
2. Select a pickup date and time slot
3. Choose bagels (1, 3, or 6 total)
4. Fill in contact information
5. Submit order
6. Pay via Venmo using the provided link
7. Wait for confirmation email

### Admin Flow

1. Navigate to `/admin` and login with your admin password
2. View pending orders in the dashboard
3. Confirm payment for pending orders (sends confirmation email)
4. Mark confirmed orders as ready (sends pickup email)
5. Manage time slots in the Time Slots tab

## Project Structure

```
paiges-bagels/
├── app/
│   ├── page.tsx                    # Customer order form
│   ├── confirmation/               # Order confirmation page
│   ├── admin/
│   │   ├── orders/                 # Admin order management
│   │   ├── slots/                  # Time slot management
│   │   └── login/                  # Admin login
│   └── api/
│       ├── orders/                 # Order CRUD operations
│       ├── slots/                  # Time slot CRUD
│       ├── capacity/               # Capacity checking
│       └── admin/                  # Admin authentication
├── components/
│   ├── OrderForm.tsx               # Main order form
│   ├── BagelSelector.tsx           # Bagel selection UI
│   ├── TimeSlotSelector.tsx        # Time slot selection UI
│   ├── AdminOrderCard.tsx          # Order card for admin
│   └── SlotManager.tsx             # Time slot management UI
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── email.ts                    # Email functions
│   └── utils.ts                    # Helper functions
├── types/
│   └── index.ts                    # TypeScript types
└── database/
    └── schema.sql                  # Database schema
```

## Pricing

- 1 bagel: $4
- 3 bagels: $10
- 6 bagels: $18

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

## Future Enhancements

- Order expiration (auto-cancel pending orders)
- Customer order tracking page
- SMS notifications via Twilio
- Multi-day batch scheduling
- Order history and analytics
- Admin reports and statistics

## License

MIT

