# Paige's Bagels — Project Plan

## What This Is
A sourdough bagel ordering system for Paige's Bagels at Kellogg (Northwestern business school). Customers order online, pay via Venmo, and pick up at 1881 Oak Avenue Apt 1510W, Evanston IL 60201. Bagels will be outside; customers use call box to call Paige Tuchner to be let upstairs if needed. Admin confirms payments and manages everything through a dashboard.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 (inline styles used heavily for brand colors)
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Email**: Resend (from `orders@paigesbagels.com`)
- **Payments**: Venmo (manual — bagel orders) + Stripe Checkout (merch orders + bagel credit card option)
- **Analytics**: Vercel Web Analytics (`@vercel/analytics` in root layout)
- **Hosting**: Vercel

## Brand
- Primary color: `#004AAD` (blue)
- Secondary color: `#7a4900` (brown, from logo — used for bagel type names)
- Background: `#f6f4f0` (warm off-white)
- Font: Georgia serif (emails), system fonts (site)
- Logo: `/public/logo.svg` (customer pages) and `/public/logo.png` (admin + emails)
- Instagram: @paigesbagels

## Current State — What's Built

### Customer-Facing Pages
| Route | Purpose |
|-------|---------|
| `/` | Full homepage: hero with gradient overlay, "Why Paige's?" value props, bagel carousel with transparent PNGs, "Sourdough Difference" photo split, "Meet the Baker" blue section, newsletter signup, final CTA |
| `/about` | Paige's story, sourdough benefits, bagel photo |
| `/menu` | Menu page with inside bagel hero (ingredients + macros) and infinite-scroll carousel of each bagel type with photos |
| `/order` | Full order form: time slot → bagels → add-ons → info → submit |
| `/hangover` | Standalone hangover page: blue hero with countdown timer, "How It Works" steps, time slot selector, inline bagel selection with images, order summary, sticky checkout bar. Does NOT use OrderForm. |
| `/contact` | Instagram link + DM prompt |
| `/confirmation` | Order summary with Venmo pay button + "Pay with Credit Card" option (3% fee), paid state on return from Stripe |
| `/merch` | Merch store: page header + category tabs, product grid (2/3 cols) of `ProductCard` links, persistent cart bar. All data from Supabase. |
| `/products/[id]` | Product detail page: two-column grid (image left, info right, stacks mobile). Server component with `ProductDetailActions` client component (size picker, qty, "Add to Bag"). |
| `/merch/confirmation` | Post-payment confirmation with order summary, polls for webhook completion |
| `/bagelfest` | Standalone mobile-first QR code landing page for Chicago Bagel Fest (March 7, 2026). No nav/footer — centered logo (h-16), wave emoji header, floating bagel animations (90px), email signup card (primary CTA → `/api/subscribers`), how-it-works vertical timeline, order CTA → `/order`, Instagram pill, brand closer. |
| `not-found.tsx` | Custom 404 page: large faded "404", "Lost Your Bagel?" headline, Go Home + Order Bagels buttons |

### Shared Components
| Component | Purpose |
|-----------|---------|
| `NavBar.tsx` | Shared logo + navigation bar used on all customer pages. Active page underlined. Uses `usePathname()` for automatic highlighting. |
| `Footer.tsx` | Full branded footer: 4-column grid (brand w/ `logo-white.svg`, quick links, social/email, newsletter signup via `/api/subscribers`), blue `#004aad` bg, bottom copyright bar. Hidden on `/admin` and `/bagelfest` routes. |
| `OrderForm.tsx` | Main customer order flow for regular orders. Hangover page no longer uses this — it has its own standalone page. |
| `HangoverBanner.tsx` | Cross-promo banner on regular order page linking to /hangover when hangover slots are available |
| `BagelSelector.tsx` | +/- counters per bagel type with transparent PNG images (64px/80px), active-row blue highlighting, max 13 total |
| `AddOnSelector.tsx` | +/- counters per add-on type with active-row blue highlighting |
| `TimeSlotSelector.tsx` | Date/time slot picker with scarcity messaging: "Bagels Available!" (13+), "Only X bagels left!" (1-12), "SOLD OUT" (0) |
| `AdminOrderCard.tsx` | Order card with confirm/ready/delete actions. Ready state shows green "Completed" badge. "Mark as Fake" toggle for artificial scarcity ($0 revenue, excluded from financials). |
| `BagelTypeManager.tsx` | Admin CRUD for bagel types with image filename, ingredients text, and macro inputs (calories, protein, carbs, fat) |
| `AddOnTypeManager.tsx` | Admin CRUD for add-on types |
| `SlotManager.tsx` | Admin CRUD for time slots. Active/Past tabs, multi-slot creation form. Past tab is read-only. |
| `CartProvider.tsx` (app/components) | Global cart context with `useCart()` hook. Manages cart items, add/remove, drawer state. Wraps app in root layout. |
| `CartDrawer.tsx` (app/components) | Slide-in cart drawer: item list, shipping form, embedded Stripe checkout. Widens to 480px in checkout mode. |
| `ProductCard.tsx` (app/components) | Pure display card wrapped in `<Link>` to `/products/[id]`. No cart logic. |
| `ProductDetailActions.tsx` (app/components) | Client component: size picker, quantity +/-, "Add to Bag" button. Uses `useCart()`. |
| `EmbeddedCheckoutForm.tsx` (app/components) | Stripe `EmbeddedCheckoutProvider` + `EmbeddedCheckout` wrapper. |

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
| `/admin/merch` | Merch management — shipping cost, item CRUD (price/stock/sizes/active), order list with "Mark Shipped" |

### API Routes
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/orders` | GET, POST | List orders, create new order |
| `/api/orders/[id]` | GET, DELETE | Get/delete single order |
| `/api/orders/[id]/confirm` | POST | Mark as confirmed + send confirmation email |
| `/api/orders/[id]/ready` | POST | Mark as ready + send pickup email |
| `/api/orders/[id]/checkout` | POST | Create Stripe Checkout Session for bagel order with 3% CC fee |
| `/api/orders/webhook` | POST | Stripe webhook for bagel payments — auto-confirms order + sends email |
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
| `/api/merch/items` | GET, POST | List active merch items, create new item |
| `/api/merch/items/[id]` | PATCH, DELETE | Update/delete merch item |
| `/api/merch/settings` | GET, PATCH | Get/update flat shipping cost |
| `/api/merch/checkout` | POST | Validate cart against DB prices, decrement stock, create order + Stripe embedded Checkout Session (returns `clientSecret`) |
| `/api/merch/webhook` | POST | Stripe webhook — handles checkout.session.completed (mark paid + email) and checkout.session.expired (restore stock + cancel) |
| `/api/merch/orders` | GET | List all merch orders (admin) |
| `/api/merch/orders/[id]` | PATCH | Update merch order status (mark shipped) |
| `/api/admin/login` | POST | Admin auth (password → cookie) |

### Auth
- Admin auth via middleware (`middleware.ts`) — checks `admin_session` cookie
- Password set via `ADMIN_PASSWORD` env var
- No customer auth (anonymous ordering)

### Database Tables
| Table | Purpose |
|-------|---------|
| `time_slots` | Pickup dates/times with capacity limits, optional cutoff time, and `is_hangover` flag |
| `orders` | Customer orders with status tracking (pending/confirmed/ready), `is_fake` flag, and `stripe_session_id` for CC payments |
| `bagel_types` | Dynamic bagel flavors (active/inactive, display order, image_url, description, calories, protein_g, carbs_g, fat_g) |
| `order_items` | Junction: order → bagel types with quantities |
| `add_on_types` | Add-on items with pricing (e.g., schmear) |
| `order_add_ons` | Junction: order → add-ons with quantities |
| `pricing` | Pricing tiers (quantity → price, with display labels and `pricing_type`: regular/hangover) |
| `ingredients` | Cost tracking with `cost_type` (per_bagel/per_addon/fixed), optional `add_on_type_id` FK for per-addon costs |
| `merch_items` | Merch products (name, price, stock, sizes, active flag, display order) |
| `merch_settings` | Single-row config for flat shipping cost (default $5.00) |
| `merch_orders` | Merch orders with JSONB line items, shipping info, Stripe session/payment intent IDs, status (pending_payment/paid/shipped/cancelled) |

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
12. `migration-merch.sql` — merch_items, merch_settings, merch_orders tables with RLS + seed data
13. `ALTER TABLE orders ADD COLUMN stripe_session_id text` + index on stripe_session_id (run manually in Supabase)

### Photos & Assets
Stored in `/public/`:
- **Transparent bagel PNGs** (used in carousels, order form rows, hangover page): `plaintrans.png`, `sesametrans.png`, `everythingtrans.png`, `salttrans.png`, `poppytrans.png`
- **Best images** (`/public/best-images/`): Curated bagel photography used across site:
  - `IMG_2184.JPG` — Crumb structure on baking sheet (homepage photo split)
  - `IMG_2102.JPG` — Variety grid on cutting board (menu banner, about strip)
  - `IMG_2113.JPEG` — Branded box with logo (menu gallery hero, contact grid hero)
  - `IMG_2107.JPG` — Sesame close-up (contact grid)
  - `IMG_2105.JPG` — Hand holding sesame overhead (about strip)
  - `IMG_2163.JPG` — Salt bagel with crystals (menu gallery, contact grid, about strip)
  - `IMG_1999.JPG` — Hand holding plain bagel (menu gallery, contact grid)
- **Other**: `background-photo.jpeg` (homepage hero), `paige.JPG` (about page + homepage), `logo.svg` (cropped, proper viewBox), `logo-white.svg` (white version for footer), `logo.png`, `logo-home.svg`

## Bugs Fixed
- **Hangover pricing leak (Feb 2025)** — `/api/orders` POST was fetching ALL pricing tiers (both regular and hangover) without filtering by `pricing_type`. The greedy bundle algorithm could pick the higher hangover tier for regular orders, causing 3 bagels to show a higher price on the confirmation page than what the customer saw on the order form. Fix: API now looks up the time slot's `is_hangover` flag and filters pricing tiers by `pricing_type` accordingly (`app/api/orders/route.ts`).
- **Order creation "Time slot not found" (Feb 2025)** — `create_order_atomic` RPC lacked `SECURITY DEFINER`, so the anon role couldn't execute `SELECT ... FOR UPDATE` on `time_slots` due to RLS. Fix: recreated function with `SECURITY DEFINER` in Supabase SQL editor. Local migration file should be updated if migrations are re-run.

## Known Tech Debt
- Legacy columns on `orders` table (`plain_count`, `everything_count`, `sesame_count`) — kept for backward compat with old orders, new orders use `order_items`
- Admin nav is duplicated across every admin page (no shared layout component)
- Default Next.js public assets still present (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`)
- README says "Next.js 14" but package.json has Next.js 16
- Real-time subscriptions only on orders page — could extend to other admin pages

## Stripe Go-Live Checklist (Bagel Payments)
- [ ] Add `STRIPE_SECRET_KEY` (live key `sk_live_...`) to Vercel environment variables
- [ ] Add `STRIPE_ORDERS_WEBHOOK_SECRET` to Vercel environment variables
- [ ] Add `NEXT_PUBLIC_SITE_URL=https://paigesbagels.com` to Vercel environment variables
- [ ] In Stripe Dashboard: add webhook endpoint `https://paigesbagels.com/api/orders/webhook` for events `checkout.session.completed` and `checkout.session.expired`
- [ ] Copy signing secret from Stripe → set as `STRIPE_ORDERS_WEBHOOK_SECRET` in Vercel

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

### Completed This Session (Mar 2026 Session 8)
- [x] **Product detail pages** — `/products/[id]` server component with two-column layout (large image left, info right, stacks on mobile). Fetches product via `getProductById()` from Supabase. Size picker, quantity, and "Add to Bag" in `ProductDetailActions` client component.
- [x] **Product card → link card** — Merch grid cards now link to `/products/[id]` instead of opening modal. Extracted into `ProductCard` component.
- [x] **Embedded Stripe checkout** — Switched merch checkout API to `ui_mode: "embedded"` with `return_url`. Cart drawer shows embedded Stripe form inline (no redirect). Uses `@stripe/react-stripe-js` `EmbeddedCheckoutProvider` + `EmbeddedCheckout`.
- [x] **Cart drawer** — Slide-in drawer from right replaces old checkout modal. Shows cart items, shipping form, and embedded Stripe payment. Widens to 480px in checkout mode. "Back to Cart" link to return from payment.
- [x] **CartProvider context** — Global cart state (`useCart()` hook) wraps app via root layout. Cart persists across `/merch` and `/products/[id]` pages. Manages add/remove, drawer open/close.
- [x] **Merch page refactor** — Reduced from 710-line monolith to ~130 lines using `ProductCard` + `useCart`. Removed inline modal, checkout panel, and all cart state.

### Completed Previously (Feb 2025 Session 7)
- [x] **Hangover page redesign** — Rebuilt as standalone page (no longer uses OrderForm). Blue hero with countdown timer, "How It Works" steps, TimeSlotSelector for multiple slots, inline bagel selection with images, order summary card, sticky checkout bar. Empty state when no slots available.
- [x] **Full homepage rebuild** — 7 sections: hero (kept), "Why Paige's?" value props (3 cards), bagel carousel with transparent PNGs + drop-shadows, "Sourdough Difference" photo split, "Meet the Baker" blue section with Paige's photo, newsletter card (existing /api/subscribers), final CTA.
- [x] **Bagel selector images** — Added transparent PNG images (64px/80px) to BagelSelector rows with drop-shadow. Active rows highlight with blue-light bg + blue border. Same highlight on AddOnSelector.
- [x] **Best images integration** — Renamed "Best images" → "best-images". Assigned 7 curated photos across homepage, menu, contact, and about pages based on content/composition.
- [x] **Hangover page metadata** — Moved to `app/hangover/layout.tsx` since page became client component.
- [x] **Full merch page** — Replaced "Coming Soon" with complete shopping experience: category filter tabs, product grid with hover effects, slide-up product detail modal (size picker, qty, add to bag), persistent cart bar, checkout panel with bag summary + shipping form → existing Stripe checkout flow. All data from Supabase.
- [x] **Branded footer** — Full 4-column footer (brand + `logo-white.svg`, quick links, Instagram/email with icons, newsletter signup). Blue `#004aad` bg, bottom copyright bar. Hidden on admin.
- [x] **Redesigned email templates** — Branded header/footer wrapper (`emailWrapper()` in `lib/email.ts`) with off-white header + logo, blue footer strip. Styled confirmation, ready, and merch emails with table-based layout + inline styles.
- [x] **404 page** — `app/not-found.tsx` with large faded "404", "Lost Your Bagel?" headline, Go Home + Order Bagels buttons.
- [x] **Cropped SVG logos** — Replaced `logo.svg` with properly cropped version (viewBox 42 95 296 165). Added `logo-white.svg` for footer. No more container/filter workarounds needed.
- [x] **Bagel Fest landing page** — `/bagelfest` standalone mobile-first page for QR code signup at Chicago Bagel Fest (March 7, 2026). No nav/footer, centered logo, wave animation, floating bagel graphics (90px), email signup card → `/api/subscribers`, how-it-works timeline, order CTA, Instagram pill, brand closer.

### Completed Previously (Feb 2025 Session 5)
- [x] **Stripe credit card payments for bagel orders** — "Pay with Credit Card" button on confirmation page with 3% fee, Stripe Checkout flow, webhook auto-confirms + sends email, "Payment Received!" state on return
- [x] **Shared NavBar component** — Extracted `components/NavBar.tsx` used on all customer pages (home, about, menu, order, contact, merch) with consistent sizing, active page underline
- [x] **Homepage redesign** — Removed hero image, moved bagel carousel to top, brown bagel type names (`#7a4900`)
- [x] **Poppy bagel image** — Added `poppytrans.png`

### Completed Previously (Feb 2025 Session 4)
- [x] **Merch page with Stripe Checkout** — Full merch store (`/merch`) with DB-driven items, size/qty selectors, shipping form, Stripe Checkout redirect, webhook handler (payment confirmation + stock restore on expiry), confirmation page with polling, admin management (`/admin/merch`) for items/shipping/orders. MERCH nav link added to all customer and admin pages.

### Completed Previously (Feb 2025 Session 3)
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
- [ ] **Dark mode admin** — Admin dashboard dark theme
- [ ] **PWA support** — Installable app for mobile ordering
- [ ] **Clean up legacy columns** — Remove `plain_count`/`everything_count`/`sesame_count` after confirming no old orders remain

### Open Questions
- Whether to keep or remove the `/menu` page (has ingredients + nutrition info not on homepage)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
RESEND_API_KEY
ADMIN_PASSWORD
NEXT_PUBLIC_VENMO_USERNAME
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET           # merch webhook
STRIPE_ORDERS_WEBHOOK_SECRET    # bagel orders webhook
NEXT_PUBLIC_SITE_URL (optional, defaults to localhost:3000)
```
