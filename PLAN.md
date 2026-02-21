# Paige's Bagels — Project Plan

## What This Is
A sourdough bagel ordering system for Paige's Bagels at Kellogg (Northwestern business school). Customers order online, pay via Venmo, and pick up at 1881 Oak Avenue Apt 1510W, Evanston IL 60201. Bagels will be outside; customers use call box to call Paige Tuchner to be let upstairs if needed. Admin confirms payments and manages everything through a dashboard.

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
| `/` | Landing page with logo + nav (About, Menu, Order, Contact) |
| `/about` | Paige's story, sourdough benefits, bagel photo |
| `/menu` | Menu page with inside bagel hero (ingredients + macros) and infinite-scroll carousel of each bagel type with photos |
| `/order` | Full order form: time slot → bagels → add-ons → info → submit |
| `/hangover` | Hangover Bagels — same-day impulse ordering with warm amber branding and higher pricing |
| `/contact` | Instagram link + DM prompt |
| `/confirmation` | Order summary with full pickup address + callbox instructions, Venmo pay button, next-steps |

### Admin Dashboard (`/admin/*`)
| Route | Purpose |
|-------|---------|
| `/admin/orders` | View/manage orders by status (pending → confirmed → completed). "Completed" is UI label; DB status remains `ready`. Email still sends on mark-complete. |
| `/admin/slots` | Create and manage pickup time slots. Active/Past tabs (past = date passed or all orders done). Multi-slot creation: multiple pickup times per date in one form. |
| `/admin/bagel-types` | Add/edit/deactivate bagel types with image filename, ingredients text, and macros (calories, protein, carbs, fat) |
| `/admin/add-ons` | Manage add-on items (e.g., schmear) with pricing |
| `/admin/pricing` | Set pricing tiers with custom labels (e.g. 1/$4, 3/$10, 6/$18) — any quantity 1-6 uses greedy bundle pricing |
| `/admin/costs` | Three-section cost tracking: Bagel Ingredients (per bagel), Add-On Costs (per unit sold, linked to add-on type), Fixed Costs (amortized over all bagels sold) |
| `/admin/financials` | Revenue, COGS, profit, margin — daily breakdown with date filters. COGS includes per-bagel ingredients, per-addon costs, and amortized fixed costs. |
| `/admin/prep` | Baking prep view: bagel counts grouped by day and time slot, plus collapsible individual orders per slot for bag packing |

### API Routes
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/orders` | GET, POST | List orders, create new order |
| `/api/orders/[id]` | GET, DELETE | Get/delete single order |
| `/api/orders/[id]/confirm` | POST | Mark as confirmed + send confirmation email |
| `/api/orders/[id]/ready` | POST | Mark as ready + send pickup email |
| `/api/slots` | GET, POST | List/create time slots. GET includes `total_orders` and `active_orders` per slot. Supports `?hangover=true` filter. POST accepts `is_hangover` field. |
| `/api/slots/[id]` | PATCH, DELETE | Update/delete time slot |
| `/api/bagel-types` | GET, POST | List/create bagel types (includes image_url, description, macro fields) |
| `/api/bagel-types/[id]` | PATCH, DELETE | Update/delete bagel type |
| `/api/add-on-types` | GET, POST | List/create add-on types |
| `/api/add-on-types/[id]` | PATCH, DELETE | Update/delete add-on type |
| `/api/pricing` | GET, PATCH | Get/update pricing tiers. Supports `?type=regular\|hangover` filter. |
| `/api/ingredients` | GET, POST, PATCH, DELETE | CRUD for ingredient costs. Supports `cost_type`: per_bagel, per_addon, fixed. |
| `/api/financials` | GET | Financial summary with optional date range. COGS from all three cost types. |
| `/api/prep` | GET | Baking prep data: aggregated counts by date → slot → bagel type, plus individual confirmed/ready orders per slot |
| `/api/capacity` | GET | Check remaining capacity for a slot |
| `/api/admin/login` | POST | Admin auth (password → cookie) |

### Auth
- Admin auth via middleware (`middleware.ts`) — checks `admin_session` cookie
- Password set via `ADMIN_PASSWORD` env var
- No customer auth (anonymous ordering)

### Database Tables
| Table | Purpose |
|-------|---------|
| `time_slots` | Pickup dates/times with capacity limits, optional cutoff time, and `is_hangover` flag |
| `orders` | Customer orders with status tracking (pending/confirmed/ready) and `is_fake` flag for artificial scarcity |
| `bagel_types` | Dynamic bagel flavors (active/inactive, display order, image_url, description, calories, protein_g, carbs_g, fat_g) |
| `order_items` | Junction: order → bagel types with quantities |
| `add_on_types` | Add-on items with pricing (e.g., schmear) |
| `order_add_ons` | Junction: order → add-ons with quantities |
| `pricing` | Pricing tiers (quantity → price, with display labels and `pricing_type`: regular/hangover) |
| `ingredients` | Cost tracking with `cost_type` (per_bagel/per_addon/fixed), optional `add_on_type_id` FK for per-addon costs |

### Migrations Applied
1. `schema.sql` — Base tables (time_slots, orders)
2. `migration-dynamic-bagels.sql` — bagel_types + order_items tables
3. `migration-pricing.sql` — pricing table
4. `migration-pricing-labels.sql` — Added label column to pricing
5. `migration-ingredients.sql` — ingredients table
6. `migration-cutoff-time.sql` — cutoff_time column on time_slots
7. `migration-add-ons.sql` — add_on_types + order_add_ons tables
8. `migration-hangover.sql` — is_hangover flag on time_slots + pricing_type column on pricing
9. `migration-fake-orders.sql` — is_fake flag on orders for artificial scarcity
10. `migration-cost-types.sql` — cost_type + add_on_type_id columns on ingredients for per-addon and fixed costs
11. `migration-menu.sql` — image_url, description, calories, protein_g, carbs_g, fat_g columns on bagel_types

### Key Components
| Component | Purpose |
|-----------|---------|
| `OrderForm.tsx` | Main customer order flow. Supports `mode` prop: `regular` (default) or `hangover` (amber branding, higher pricing, different copy). Nav includes MENU link. |
| `HangoverBanner.tsx` | Cross-promo banner on regular order page linking to /hangover when hangover slots are available |
| `BagelSelector.tsx` | +/- counters per bagel type, max 6 total |
| `AddOnSelector.tsx` | +/- counters per add-on type |
| `TimeSlotSelector.tsx` | Date/time slot picker with scarcity messaging: "Bagels Available!" (13+), "Only X bagels left!" (1-12), "SOLD OUT" (0) |
| `AdminOrderCard.tsx` | Order card with confirm/ready/delete actions. Ready state shows green "Completed" badge. "Mark as Fake" toggle for artificial scarcity ($0 revenue, excluded from financials). |
| `BagelTypeManager.tsx` | Admin CRUD for bagel types with image filename, ingredients text, and macro inputs (calories, protein, carbs, fat) |
| `AddOnTypeManager.tsx` | Admin CRUD for add-on types |
| `SlotManager.tsx` | Admin CRUD for time slots. Active/Past tabs, multi-slot creation form. Past tab is read-only. |

### Bagel Photos
Photos stored in `/public/`:
- `inside.jpg` — cross-section hero photo used on menu page
- `plain.jpg` — Plain bagel
- `sesame.jpg` — Sesame bagel
- `poppy.jpg` — Poppy Seed bagel
- `logo.svg` — Customer-facing logo
- `logo.png` — Admin + email logo
- `logo-transparent.svg` — Transparent logo for hangover banner

## Bugs Fixed
- **Hangover pricing leak (Feb 2025)** — `/api/orders` POST was fetching ALL pricing tiers (both regular and hangover) without filtering by `pricing_type`. The greedy bundle algorithm could pick the higher hangover tier for regular orders, causing 3 bagels to show a higher price on the confirmation page than what the customer saw on the order form. Fix: API now looks up the time slot's `is_hangover` flag and filters pricing tiers by `pricing_type` accordingly (`app/api/orders/route.ts`).
- **Order creation "Time slot not found" (Feb 2025)** — `create_order_atomic` RPC lacked `SECURITY DEFINER`, so the anon role couldn't execute `SELECT ... FOR UPDATE` on `time_slots` due to RLS. Fix: recreated function with `SECURITY DEFINER` in Supabase SQL editor. Local migration file should be updated if migrations are re-run.

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
- [x] **Multi-slot creation** — Create multiple pickup times per date in one form submission
- [ ] **Recurring time slots** — Bulk-create weekly slots instead of one at a time
- [ ] **Shared admin layout** — Extract nav into a layout component to reduce duplication

### Medium Priority
- [ ] **SMS notifications** — Twilio integration for order confirmation and ready alerts
- [ ] **Order history/analytics** — Charts for trends, popular bagel types, repeat customers
- [ ] **Multi-day batch scheduling** — Plan baking schedules across multiple days
- [ ] **Customer favorites** — Remember returning customers by email, pre-fill their order
- [x] **Flexible quantity validation** — Customers can order any quantity 1-6, pricing uses greedy bundle algorithm
- [x] **Scarcity messaging** — Show "Only X bagels left!" when ≤12 remain, "Bagels Available!" when plentiful, "SOLD OUT" at 0

### Completed This Session
- [x] **Prep page individual orders** — Collapsible "Orders (N)" section under each time slot showing confirmed/ready orders with customer name, bagel breakdown, add-ons, and price for bag packing. Pending/fake orders excluded from list but still count toward baking totals.

### Completed Previously (Feb 2025 Session 2)
- [x] **Homepage hero redesign** — Removed stacked nav links from hero, added horizontal scrollable nav bar below hero, hero now shows only tagline. Lightened overlay from 40% to 25% for better image visibility.
- [x] **Prep page add-on counts** — API and UI now show add-on counts (yellow chips) per time slot alongside bagel counts
- [x] **Prep page day totals** — Summed bagel type and add-on counts across all time slots displayed at bottom of each day card
- [x] **Order creation bug fix** — `create_order_atomic` RPC needed `SECURITY DEFINER` to bypass RLS for `SELECT ... FOR UPDATE` on `time_slots`. Applied manually in Supabase SQL editor. Also surfaced actual Supabase error messages in API response.

### Completed Previously
- [x] **Pickup location update** — Changed to 1881 Oak Avenue Apt 1510W with callbox instructions
- [x] **Baking prep page** — `/admin/prep` shows bagel counts by day/slot for baking planning
- [x] **COGS cost types** — Per-bagel ingredients, per-addon costs (schmear), and fixed costs (amortized)
- [x] **Menu page** — `/menu` with inside bagel hero, ingredients, macros, and infinite-scroll carousel
- [x] **Bagel photos** — Admin-editable image filenames, ingredients, and macros per bagel type

### Low Priority / Nice to Have
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
