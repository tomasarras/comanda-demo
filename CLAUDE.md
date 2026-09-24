# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Comanda is a fictional restaurant-management demo (portfolio project): Next.js App Router (JS, not TS) + Prisma/PostgreSQL (Neon), Tailwind v4.

## Commands

```
npm run dev       # next dev (localhost:3000)
npm run build     # next build
npm run lint      # eslint
npm run db:seed   # node prisma/seed.mjs — wipes and reseeds categories/products/suppliers
```

No test suite exists in this repo.

Prisma workflow: edit `prisma/schema.prisma`, then `npx prisma migrate dev --name <desc>` (writes to `prisma/migrations/`), then `npx prisma generate` if the client needs regenerating. `DATABASE_URL`/`DIRECT_URL` (Neon pooled + direct) come from `.env`.

## Architecture

**Role gate, not auth.** There is no login. `RoleProvider` (`components/RoleProvider.js`) stores a chosen `roleId` in `localStorage` and exposes it via `useRole()`. `app/page.js` is the role picker; picking a role redirects to `/panel`. `app/(dashboard)/layout.js` is the enforcement point: it redirects to `/` if no role is loaded, and redirects to the role's first allowed section if the current path isn't in `getAllowedSections(role)`. Roles and their per-section access (`ROLES`, `NAV_SECTIONS`) live in `lib/roles.js` — add a new dashboard section there, not just as a new route. As `lib/roles.js` itself notes, this is UX guidance only, not an enforced permission boundary (no server-side check re-validates the role on API routes).

**Route groups.** `app/(dashboard)/<section>/page.js` for each nav section (panel, ordenes, mostrador, ventas, gastos, productos, caja, proveedores), sharing the Sidebar/Topbar chrome from `app/(dashboard)/layout.js`. `app/api/<resource>/route.js` (+ `[id]/route.js`, and action-specific subroutes like `orders/[id]/checkout`, `orders/[id]/status`, `caja/open|close|movement|current|history`, `sales/checkout`) are plain Next.js Route Handlers using `NextResponse.json`, no shared middleware/wrapper — each route does its own validation and returns `{ error }` with a status code on failure.

**Domain logic lives in `lib/`, not in route handlers or components.** Each feature has a co-located helper module of pure/transaction functions plus serializers that convert Prisma `Decimal` fields to `Number` for JSON responses:
- `lib/orders.js` — `ORDER_FLOW` (`ABIERTA → EN_COCINA → LISTA → ENTREGADA`; PAGADA/CANCELADA are terminal, reached via checkout/cancel, not `nextStatus`), `serializeOrder`.
- `lib/sales.js` — `completeSale` (Mostrador: creates an already-PAGADA order + Sale + Caja movement in one transaction) and `checkoutOrder` (Órdenes de salón: finalizes payment on an order that already went through the kitchen flow). Both throw `SaleError(message, status)` for handlers to catch and translate into an HTTP response; both require an open `CashRegisterShift` and decrement product stock.
- `lib/caja.js` — `serializeShift`/`serializeMovement`, and `computeRunningTotal` (opening amount + INGRESO/VENTA − EGRESO).
- `lib/expenses.js`, `lib/format.js` (`formatCurrency`, es-AR/ARS) follow the same pattern.

When adding a feature that touches money or order state, follow this split: mutate/validate in a `lib/<feature>.js` helper (wrapped in `prisma.$transaction` when it touches more than one model), keep the route handler thin, and add a `serialize*` function rather than passing Prisma records straight to `NextResponse.json` (Decimal fields don't serialize to plain numbers on their own).

**Data model** (`prisma/schema.prisma`): `Category → Product → OrderItem → Order → Sale`, plus `Supplier → Expense` and `CashRegisterShift → CashMovement`. The schema was sketched in full up front so later phases wouldn't need destructive migrations — not every model has UI wired up yet; check `app/(dashboard)/` and `app/api/` before assuming a model is unused.

**Client conventions**: components are plain JS (`.js`, not `.jsx`/`.tsx`) using `"use client"` where needed, Tailwind utility classes, `lucide-react` icons, and the `@/*` path alias (`jsconfig.json`) resolving to repo root. UI copy and labels are in Spanish (Argentina) — match this when adding strings.
