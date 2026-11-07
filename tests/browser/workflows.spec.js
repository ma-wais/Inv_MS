import { test, expect } from '@playwright/test';

import { registerShop } from './helpers.js';

test('profile formatting, separator deletion, upload and password change work in the browser', async ({ page }) => {
    await registerShop(page);
    await page.goto('/profile');
    const phone = page.getByLabel('Phone Number');
    await phone.fill('0300-1234567');
    await expect(phone).toHaveValue('300 1234567');
    const cnic = page.getByLabel('CNIC (13 digits)');
    await cnic.fill('3520212345671');
    await expect(cnic).toHaveValue('35202-1234567-1');
    await cnic.evaluate(element => element.setSelectionRange(6, 6));
    await cnic.press('Backspace');
    await expect(cnic).toHaveValue('35201-2345671');
    await cnic.fill('3520212345671');
    await page.locator('input[type=file]').setInputFiles({
        name: 'avatar.png', mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
    });
    await page.getByRole('button', { name: 'Save Profile Details' }).click();
    await expect(page.getByText('Profile updated successfully.')).toBeVisible();
    await page.reload();
    await expect(phone).toHaveValue('300 1234567');
    await expect(cnic).toHaveValue('35202-1234567-1');
    await expect(page.getByRole('img', { name: 'Profile', exact: true })).toBeVisible();
    await page.getByLabel(/^Current password/).fill('browser-password');
    await page.getByLabel(/^New Password/).fill('changed-password');
    await page.getByLabel(/^Confirm New Password/).fill('changed-password');
    await page.getByRole('button', { name: 'Update Password', exact: true }).click();
    await expect(page.getByText('Password updated successfully.')).toBeVisible();
    await page.screenshot({ path: 'test-results/profile-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('aside')).not.toBeInViewport();
    await page.screenshot({ path: 'test-results/profile-mobile.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'Remove photo', exact: true }).click();
    await page.getByRole('button', { name: 'Save Profile Details' }).click();
    await expect(page.getByRole('img', { name: 'Profile', exact: true })).toHaveCount(0);
});

test('dropdown search and keyboard selection work inside a modal, and workers see appropriate navigation', async ({ page, browser }) => {
    const suffix = await registerShop(page);
    await page.goto('/settings/staff');
    await page.getByRole('button', { name: 'Add Staff Member' }).click();
    await page.getByLabel(/^Email Address/).fill(`worker-${suffix}@ventory.test`);
    await page.getByLabel(/^Full Name/).fill('Browser Worker');
    await page.getByLabel(/^Temporary Password/).fill('worker-password');
    await page.getByRole('combobox', { name: 'Shop Role', exact: true }).click();
    await page.getByRole('combobox', { name: 'Search Shop Role', exact: true }).fill('worker');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('combobox', { name: 'Shop Role', exact: true })).toContainText('Worker');
    await page.getByRole('button', { name: 'Link Staff', exact: true }).click();
    await expect(page.getByRole('cell', { name: /Browser Worker/ })).toBeVisible();
    const workerContext = await browser.newContext();
    const workerPage = await workerContext.newPage();
    await workerPage.goto('http://127.0.0.1:8175/login');
    await workerPage.locator('input[type=email]').fill(`worker-${suffix}@ventory.test`);
    await workerPage.locator('input[type=password]').fill('worker-password');
    await workerPage.locator('button[type=submit]').click();
    await expect(workerPage).toHaveURL(/\/dashboard/);
    await expect(workerPage.getByRole('button', { name: /Accounting Ledger/ })).toHaveCount(0);
    await expect(workerPage.getByRole('button', { name: /^Settings/ })).toHaveCount(0);
    await workerPage.goto('http://127.0.0.1:8175/pos');
    await expect(workerPage.getByRole('combobox', { name: 'Select Customer', exact: true })).toContainText('Walk-in Customer');
    await workerContext.close();
});

test('quick customer creation selects the new customer and supports keyboard navigation', async ({ page }) => {
    await registerShop(page);
    await page.goto('/pos');
    await page.getByRole('button', { name: '+ Customer', exact: true }).click();
    const modal = page.locator('form').filter({ has: page.getByRole('button', { name: 'Add Customer', exact: true }) });
    await modal.locator('input[type=text]').first().fill('POS Customer');
    await modal.getByLabel('Phone number').fill('+92 312 1234567');
    await modal.getByLabel('CNIC (13 digits)').fill('3520212345671');
    await modal.getByRole('button', { name: 'Add Customer', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Select Customer', exact: true })).toContainText('POS Customer');
    await page.getByRole('combobox', { name: 'Select Customer', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: 'Finalize & Print Invoice' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('barcode checkout with split payments posts the invoice and reduces stock once', async ({ page }) => {
    const suffix = await registerShop(page);
    await page.goto('/products/create');
    const initialPage = JSON.parse(await page.locator('script[data-page=app]').textContent());
    const unit = initialPage.props.units[0];
    const warehouse = initialPage.props.warehouses[0];
    const sku = `SCAN-${suffix}`;
    const barcode = `BAR-${suffix}`;
    const xsrfCookie = (await page.context().cookies()).find(cookie => cookie.name === 'XSRF-TOKEN');
    const created = await page.request.post('/products', { headers: { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.value) }, data: {
        name: 'Scanner Paint', base_unit_id: unit.id, product_type: 'standard',
        track_batches: false, track_expiry: false,
        variants: [{ name: 'Can', sku, barcode, purchase_price: 50, sale_price: 100, reorder_level: 2, opening_stock: 10, warehouse_id: warehouse.id }],
    } });
    expect(created.ok(), `Opening-stock fixture request failed with status ${created.status()}`).toBeTruthy();
    await page.goto('/pos');
    const search = page.getByRole('textbox', { name: 'Search products or scan a barcode' });
    await search.fill(barcode);
    await search.press('Enter');
    await expect(page.getByRole('spinbutton', { name: 'Quantity for Scanner Paint (Can)' })).toHaveValue('1');
    await page.getByLabel('Split payment').check();
    await page.getByRole('spinbutton', { name: 'Second payment amount' }).fill('40');
    await page.getByRole('button', { name: 'Finalize & Print Invoice' }).click();
    await expect(page).toHaveURL(/\/sales\/\d+/);
    await expect(page.getByText('Sale saved.')).toBeVisible();
    const catalog = await (await page.request.get(`/pos/catalog?search=${encodeURIComponent(sku)}`)).json();
    expect(Number(catalog.variants[0].stock_balances[0].quantity)).toBe(9);
});

async function fixtureRequest(page, method, url, data) {
    const cookie = (await page.context().cookies()).find(item => item.name === 'XSRF-TOKEN');
    const response = await page.request[method](url, {
        headers: { 'X-XSRF-TOKEN': decodeURIComponent(cookie.value) }, data,
    });
    expect(response.ok(), `${method} ${url} failed: ${response.status()}`).toBeTruthy();
    return response;
}

async function returnFixture(page, suffix) {
    await page.goto('/products/create');
    const { props } = JSON.parse(await page.locator('script[data-page=app]').textContent());
    const unit = props.units.find(item => item.symbol === 'pc');
    const warehouse = props.warehouses[0];
    await fixtureRequest(page, 'post', '/products', {
        name: 'Return Test Paint', base_unit_id: unit.id, product_type: 'standard', track_batches: false, track_expiry: false,
        variants: [
            { name: 'Can', sku: `RETURN-${suffix}`, purchase_price: 100, sale_price: 150, opening_stock: 10, warehouse_id: warehouse.id },
            { name: 'Gift', sku: `GIFT-${suffix}`, purchase_price: 25, sale_price: 0, opening_stock: 10, warehouse_id: warehouse.id },
        ],
    });
    const catalog = await (await page.request.get('/pos/catalog?search=Return%20Test%20Paint')).json();
    const can = catalog.variants.find(item => item.name === 'Can');
    const gift = catalog.variants.find(item => item.name === 'Gift');
    return { can, gift, warehouse };
}

test('a discounted partial sale return leaves other rows blank and preserves original costs', async ({ page }) => {
    const suffix = await registerShop(page);
    const { can, gift, warehouse } = await returnFixture(page, suffix);
    await page.goto('/pos');
    const { props } = JSON.parse(await page.locator('script[data-page=app]').textContent());
    const customer = props.customers.find(item => item.name === 'Walk-in Customer');
    const checkout = await fixtureRequest(page, 'post', '/sales', {
        customer_id: customer.id, warehouse_id: warehouse.id, sale_date: '2026-10-13', status: 'posted',
        discount_total: 40, tax_total: 10, shipping_total: 10, payment_amount: 280, payment_method: 'cash',
        items: [
            { product_variant_id: can.id, quantity: 2, unit_price: 150 },
            { product_variant_id: gift.id, quantity: 1, unit_price: 0 },
        ],
    });
    const invoiceUrl = new URL(checkout.url()).origin + new URL(checkout.url()).pathname;
    expect(invoiceUrl).toMatch(/\/sales\/\d+$/);
    await page.goto(`/products/${can.product_id}`);
    await page.getByRole('row').filter({ hasText: can.sku }).getByRole('button', { name: 'Edit', exact: true }).click();
    const editForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save Changes', exact: true }) });
    await editForm.getByLabel('Purchase Price', { exact: true }).fill('200');
    await editForm.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await expect(page.getByText('Variant updated successfully.')).toBeVisible();
    await page.goto(`${invoiceUrl}/returns/create`);
    await page.getByRole('spinbutton', { name: `${can.sku} return quantity`, exact: true }).fill('1');
    await expect(page.getByRole('spinbutton', { name: `${gift.sku} return quantity`, exact: true })).toHaveValue('');
    await expect(page.getByText('Estimated return credit: PKR 140.00.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Post return', exact: true }).click();
    await expect(page).toHaveURL(invoiceUrl);
    await expect(page.getByText('Sale return posted.')).toBeVisible();
    await expect(page.getByText('Returned total', { exact: true }).locator('..')).toContainText('140.00');
    await expect(page.getByText('Credit balance', { exact: true }).locator('..')).toContainText('140.00');
    const catalog = await (await page.request.get(`/pos/catalog?search=${encodeURIComponent(can.sku)}`)).json();
    expect(Number(catalog.variants[0].stock_balances[0].quantity)).toBe(9);
    await page.goto('/reports/product-profit?start_date=2026-10-01&end_date=2026-10-31');
    const reportPage = JSON.parse(await page.locator('script[data-page=app]').textContent());
    const report = reportPage.props.reportData.find(row => row.variant_id === can.id);
    expect(report.revenue).toBe(140);
    expect(report.cogs).toBe(100);
    expect(report.profit).toBe(40);
});

test('a discounted partial purchase return reduces the displayed amount due', async ({ page }) => {
    const suffix = await registerShop(page);
    const { can, gift, warehouse } = await returnFixture(page, suffix);
    await page.goto('/suppliers');
    await fixtureRequest(page, 'post', '/suppliers', { name: 'Return Supplier', opening_balance: 0 });
    await page.goto('/purchases/create');
    const { props } = JSON.parse(await page.locator('script[data-page=app]').textContent());
    const supplier = props.suppliers.find(item => item.name === 'Return Supplier');
    const purchased = await fixtureRequest(page, 'post', '/purchases', {
        supplier_id: supplier.id, warehouse_id: warehouse.id, purchase_date: '2026-10-13', status: 'received',
        discount_total: 20, shipping_total: 10,
        items: [
            { product_variant_id: can.id, quantity: 2, unit_cost: 100 },
            { product_variant_id: gift.id, quantity: 1, unit_cost: 0 },
        ],
    });
    const invoiceUrl = purchased.url();
    expect(invoiceUrl).toMatch(/\/purchases\/\d+$/);
    await page.goto(`${invoiceUrl}/returns/create`);
    await page.getByRole('spinbutton', { name: `${can.sku} return quantity`, exact: true }).fill('1');
    await expect(page.getByText('Estimated return credit: PKR 95.00.', { exact: false })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'test-results/purchase-return-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Post return', exact: true }).click();
    await expect(page).toHaveURL(invoiceUrl);
    await expect(page.getByText('Purchase return posted.')).toBeVisible();
    await expect(page.getByText('Outstanding', { exact: true }).locator('..')).toContainText('95.00');
    await expect(page.getByText('Returned total', { exact: true }).locator('..')).toContainText('95.00');
});
