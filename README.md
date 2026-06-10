# Ventory

Ventory is a Laravel and React inventory management system for shops such as paint stores, pharmacies, superstores, and general retail.

## Stack

- Laravel backend
- React frontend through Inertia.js
- Tailwind CSS
- MySQL/MariaDB
- Tenant-ready shared database design

## Current Foundation

- Laravel app scaffolded in this project root.
- React/Inertia app shell configured.
- Tenant/shop model added.
- Branch model added.
- Warehouse model added.
- User-to-shop membership pivot added.
- Single `accounts` table added for accounting ledgers.
- Session authentication and shop switching added.
- Tenant-aware model scope and permission middleware added.
- Shop settings, audit-log foundation, and dashboard shell added.
- Product categories, brands, units, variants, SKUs, and barcodes added.
- Product-specific unit conversions added.
- Immutable stock movements, cached balances, low-stock display, and adjustments added.

## Local Setup

Create a MySQL database named `ventory`, then run:

```bash
composer install
npm.cmd install
php artisan key:generate
php artisan migrate --seed
npm.cmd run build
php artisan serve
```

For active frontend development, run `npm.cmd run dev` in a second terminal.

After seeding, the demo owner login is:

```text
Email: owner@ventory.test
Password: password
```

## Important Accounting Decision

Ventory uses one `accounts` table. We are not copying HMS2's split between `chart_id` and `account_id`. Sales, purchases, payments, expenses, and journal entries should all point to `accounts.id`.
