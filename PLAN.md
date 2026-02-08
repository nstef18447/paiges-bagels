# Paige's Bagels — Project Plan

## What This Is
A sourdough bagel ordering system for Paige's Bagels at Kellogg (Northwestern business school). Customers order online, pay via Venmo, and pick up at E2 1510W. Admin confirms payments and manages everything through a dashboard.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 (inline styles used heavily for brand colors)
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Email**: Resend (from `orders@paigesbagels.com`)
- **Payments**: Venmo (manual — no API, just deep links)
- **Analytics**: Vercel Web Analytics (`@vercel/analytics` in root layout)
- **Hosting**: Vercel

## Brand
- Primary color: `#004AAD` (blue)
- Background: `#f6f4f0` (warm off-white)
- Font: Georgia serif (emails), system fonts (site)
- Logo: `/public/logo.svg` (customer pages) and `/public/logo.png` (admin + emails)
- Instagram: @paigesbagels

## Current State — What's Built

### Customer-Facing Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing page with logo + nav (About, Order, Contact) |
| `/about` | Paige's story, sourdough benefits, bagel photo |
| `/order` | Full order form: time slot → bagels → add-ons → info → submit |
| `/contact` | Instagram link + DM prompt |
| `/confirmation` | Order summary, Venmo pay button, next-steps instructions |

### Admin Dashboard (`/admin/*`)
| Route | Purpose |
|-------|---------|
| `/admin/orders` | View/manage orders by status (pending → confirmed → ready) |
| `/admin/slots` | Create and manage pickup time slots with capacity limits |
| `/admin/bagel-types` | Add/edit/deactivate bagel types (dynamic, not hardcoded) |
| `/admin/add-ons` | Manage add-on items (e.g., schmear) with pricing |
| `/admin/pricing` | Set pricing tiers with custom labels (e.g. 1/$4, 3/$10, 6/$18) — any quantity 1-6 uses greedy bundle pricing |
| `/admin/costs` | Track ingredient costs and cost-per-bagel |
| `/admin/financials` | Revenue, COGS, profit, margin — daily breakdown with date filters |

### API Routes
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/orders` | GET, POST | List orders, create new order |
| `/api/orders/[id]` | GET, DELETE | Get/delete single order |
| `/api/orders/[id]/confirm` | POST | Mark as confirmed + send confirmation email |
| `/api/orders/[id]/ready` | POST | Mark as ready + send pickup email |
| `/api/slots` | GET, POST | List/create time slots |
| `/api/slots/[id]` | PATCH, DELETE | Update/delete time slot |
| `/api/bagel-types` | GET, POST | List/create bagel types |
| `/api/bagel-types/[id]` | PATCH, DELETE | Update/delete bagel type |
| `/api/add-on-types` | GET, POST | List/create add-on types |
| `/api/add-on-types/[id]` | PATCH, DELETE | Update/delete add-on type |
| `/api/pricing` | GET, PATCH | Get/update pricing tiers |
| `/api/ingredients` | GET, POST, PATCH, DELETE | CRUD for ingredient costs |
| `/api/financials` | GET | Financial summary with optional date range |
| `/api/capacity` | GET | Check remaining capacity for a slot |
| `/api/admin/login` | POST | Admin auth (password → cookie) |

### Auth
- Admin auth via middleware (`middleware.ts`) — checks `admin_session` cookie
- Password set via `ADMIN_PASSWORD` env var
- No customer auth (anonymous ordering)

### Database Tables
| Table | Purpose |
|-------|---------|
| `time_slots` | Pickup dates/times with capacity limits and optional cutoff time |
| `orders` | Customer orders with status tracking (pending/confirmed/ready) |
| `bagel_types` | Dynamic bagel flavors (active/inactive, display order) |
| `order_items` | Junction: order → bagel types with quantities |
| `add_on_types` | Add-on items with pricing (e.g., schmear) |
| `order_add_ons` | Junction: order → add-ons with quantities |
| `pricing` | Pricing tiers (quantity → price, with display labels) |
| `ingredients` | Ingredient cost tracking (unit cost × units per bagel) |

### Migrations Applied
1. `schema.sql` — Base tables (time_slots, orders)
2. `migration-dynamic-bagels.sql` — bagel_types + order_items tables
3. `migration-pricing.sql` — pricing table
4. `migration-pricing-labels.sql` — Added label column to pricing
5. `migration-ingredients.sql` — ingredients table
6. `migration-cutoff-time.sql` — cutoff_time column on time_slots
7. `migration-add-ons.sql` — add_on_types + order_add_ons tables

### Key Components
| Component | Purpose |
|-----------|---------|
| `OrderForm.tsx` | Main customer order flow (fetches slots, types, pricing, handles submit) |
| `BagelSelector.tsx` | +/- counters per bagel type, max 6 total |
| `AddOnSelector.tsx` | +/- counters per add-on type |
| `TimeSlotSelector.tsx` | Date/time slot picker with capacity display |
| `AdminOrderCard.tsx` | Order card with confirm/ready/delete actions |
| `BagelTypeManager.tsx` | Admin CRUD for bagel types |
| `AddOnTypeManager.tsx` | Admin CRUD for add-on types |
| `SlotManager.tsx` | Admin CRUD for time slots |

## Known Tech Debt
- Legacy columns on `orders` table (`plain_count`, `everything_count`, `sesame_count`) — kept for backward compat with old orders, new orders use `order_items`
- Admin nav is duplicated across every admin page (no shared layout component)
- Default Next.js public assets still present (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`)
- README says "Next.js 14" but package.json has Next.js 16
- Real-time subscriptions only on orders page — could extend to other admin pages

## Feature Roadmap

### High Priority
- [ ] **Order expiration** — Auto-cancel pending orders that haven't been paid after X hours
- [ ] **Customer order tracking** — Page where customers can check order status by email or order ID
- [ ] **Recurring time slots** — Bulk-create weekly slots instead of one at a time
- [ ] **Shared admin layout** — Extract nav into a layout component to reduce duplication

### Medium Priority
- [ ] **SMS notifications** — Twilio integration for order confirmation and ready alerts
- [ ] **Order history/analytics** — Charts for trends, popular bagel types, repeat customers
- [ ] **Multi-day batch scheduling** — Plan baking schedules across multiple days
- [ ] **Customer favorites** — Remember returning customers by email, pre-fill their order
- [x] **Flexible quantity validation** — Customers can order any quantity 1-6, pricing uses greedy bundle algorithm

### Low Priority / Nice to Have
- [ ] **Image uploads for bagel types** — Show photos on the order form
- [ ] **Promo codes / discounts** — Apply percentage or flat discounts
- [ ] **Catering orders** — Larger quantity tiers for events
- [ ] **Email templates** — Move HTML email templates to separate files or use React Email
- [ ] **Dark mode admin** — Admin dashboard dark theme
- [ ] **PWA support** — Installable app for mobile ordering
- [ ] **Clean up legacy columns** — Remove `plain_count`/`everything_count`/`sesame_count` after confirming no old orders remain

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
RESEND_API_KEY
ADMIN_PASSWORD
NEXT_PUBLIC_VENMO_USERNAME
```
