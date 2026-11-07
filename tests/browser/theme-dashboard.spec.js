import { test, expect } from '@playwright/test';
import { registerShop } from './helpers.js';

async function assertDarkSurfaces(page, route) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveClass(/dark/);
    const lightSurfaces = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        return [...document.querySelectorAll('main [class*="bg-"], main thead, main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), main textarea, main select')]
            .filter(element => element.getBoundingClientRect().width > 0)
            .filter(element => {
                context.clearRect(0, 0, 1, 1);
                context.fillStyle = getComputedStyle(element).backgroundColor;
                context.fillRect(0, 0, 1, 1);
                const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
                return alpha > 200 && Math.min(red, green, blue) > 160;
            }).map(element => `${element.tagName}.${element.className}`);
    });
    expect(lightSurfaces, `${route} contains light surfaces in dark mode`).toEqual([]);
}

test('shop forms, tables, reports and POS share the dark theme', async ({ page }) => {
    test.setTimeout(180000);
    await page.addInitScript(() => localStorage.setItem('app_theme', 'dark'));
    await registerShop(page);
    for (const route of ['/dashboard', '/inventory/setup', '/suppliers', '/purchases/create', '/purchases', '/purchases/returns',
        '/customers', '/sales', '/sales/returns', '/pos', '/profile', '/settings/media', '/settings/shop', '/products', '/stock',
        '/journals', '/accounts', '/reports/product-profit', '/reports/profit-loss', '/reports/receivables-payables', '/reports/expiry', '/reports/inventory-valuation']) {
        await assertDarkSurfaces(page, route);
    }
    await page.goto('/pos');
    await page.getByRole('combobox', { name: 'Select Customer', exact: true }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    expect(await page.getByRole('listbox').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(255, 255, 255)');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('aside')).toBeHidden();
    await page.screenshot({ path: 'test-results/pos-dark-mobile.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('system shops, users, backups and activity logs render in dark mode', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('app_theme', 'dark'));
    await page.goto('/login');
    await page.locator('input[type=email]').fill('testing.system@ventory.test');
    await page.locator('input[type=password]').fill('VentoryTest123!');
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(/super-admin\/tenants/);
    for (const route of ['/super-admin/tenants', '/super-admin/users', '/super-admin/backups', '/super-admin/activity-logs']) {
        await assertDarkSurfaces(page, route);
    }
    await page.screenshot({ path: 'test-results/system-logs-dark.png', fullPage: true });
});

test('dashboard period selectors, metric links and shop logo upload work together', async ({ page }) => {
    await registerShop(page);
    await expect(page.getByRole('combobox', { name: 'Dashboard period', exact: true })).toHaveValue('today');
    await page.getByRole('combobox', { name: 'Net sales period', exact: true }).selectOption('month');
    await expect(page).toHaveURL(/period=month/);
    await expect(page.getByRole('combobox', { name: 'Net purchases period', exact: true })).toHaveValue('month');
    await page.getByLabel('Dashboard start date', { exact: true }).fill('2026-10-01');
    await page.getByLabel('Dashboard end date', { exact: true }).fill('2026-10-13');
    await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
    await expect(page).toHaveURL(/period=custom/);
    await page.getByRole('link', { name: 'View net sales details', exact: true }).click();
    await expect(page).toHaveURL(/dashboard\/metrics\/sales.*start_date=2026-10-01/);
    await expect(page.getByText('No matching entries.', { exact: true })).toBeVisible();
    await page.goto('/settings/shop');
    await page.getByLabel('Shop logo', { exact: true }).setInputFiles({ name: 'shop.png', mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
    await page.getByRole('button', { name: 'Save settings', exact: true }).click();
    await expect(page.getByText('Shop settings updated.', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator('main').getByRole('img', { name: /logo$/ })).toBeVisible();
    await page.getByRole('button', { name: 'Remove logo', exact: true }).click();
    await page.getByRole('button', { name: 'Save settings', exact: true }).click();
    await expect(page.locator('main').getByRole('img', { name: /logo$/ })).toHaveCount(0);
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Switch to Dark Mode', exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.screenshot({ path: 'test-results/dashboard-dark.png', fullPage: true });
});
