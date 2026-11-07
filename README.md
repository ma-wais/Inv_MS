# Ventory

Ventory is a Laravel and React inventory management system for shops such as paint stores, pharmacies, superstores, and general retail.

## Stack

- Laravel backend
- React frontend through Inertia.js
- Tailwind CSS
- MySQL/MariaDB
- Tenant-ready shared database design

## Implemented Workflows

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
- Suppliers, purchases, receiving, returns, payments, and supplier ledgers.
- Customers, POS barcode search, batch selection, split payments, returns, and customer ledgers.
- Atomic checkout with stock/accounting rollback when payment or validation fails.
- Historical sale cost snapshots, invoice-adjusted partial return credits, and return-aware invoice balances/product profit.
- Chart of accounts, journals, expenses, operational reports, and dashboard summaries.
- Two shop roles: admin and worker, with matching backend access and navigation.
- Pakistani phone formatting, optional 13-digit CNIC, editable customer/supplier details, and profile photo upload/removal.
- Searchable dropdowns, paginated contact lists, responsive pages, and bounded POS catalog search.
- Shop onboarding, platform administration, media gallery, and database backups.
- Shared light/dark theme across shop and platform screens; Today dashboard, period filters and metric drill-downs.
- Clean shop provisioning with Admin/Worker, standard units, General category and required accounting accounts; shop logo upload and initials fallback.
- Daily compressed private database backups at 03:00 Asia/Karachi, seven-day retention and a verified SQL restore test.

The app is still undergoing completion. See [the completion backlog](docs/ROADMAP.md) for the accounting, inventory, printing, import, and deployment work that remains.

## Validation

Use a dedicated `ventory_test` MySQL database. Run backend and browser suites sequentially because they share that database. Browser checks use installed Microsoft Edge and port 8175.

```bash
php artisan test
npm.cmd run test:frontend
npm.cmd run build
npm.cmd run test:browser
```

## Local Setup

Create a MySQL database named `ventory`, then run:

```bash
composer install
npm.cmd install
php artisan key:generate
php artisan migrate
php artisan ventory:testing-accounts
npm.cmd run build
php artisan serve
```

For active frontend development, run `npm.cmd run dev` in a second terminal.

For an isolated local testing shop with admin and worker accounts, run:

```text
php artisan ventory:testing-accounts
```

Sign in with `testing.admin@ventory.test` or `testing.worker@ventory.test`, password `VentoryTest123!`. Rerunning the command preserves existing passwords. See [the testing guide](docs/TESTING.md) for setup, credentials and checks with expected results.

For platform testing use `testing.system@ventory.test` with the same local password. Production administrators are created interactively with `php artisan ventory:admin your-email@example.com`; testing accounts and demo seeders are blocked in production. The default database seeder creates only permissions. Optional local demonstration data: `php artisan db:seed --class=DemoSeeder`.

See [the cPanel deployment guide](docs/DEPLOYMENT_CPANEL.md) for cron activation and retention/restore instructions, and [the gap analysis](docs/GAP_ANALYSIS.md) for costing, transfers, write-offs and register closing that remain to be implemented.

## Important Accounting Decision

Ventory uses one `accounts` table. We are not copying HMS2's split between `chart_id` and `account_id`. Sales, purchases, payments, expenses, and journal entries should all point to `accounts.id`.
