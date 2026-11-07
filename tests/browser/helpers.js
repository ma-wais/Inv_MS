import { expect } from '@playwright/test';

export async function registerShop(page) {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
    const email = `browser-${suffix}@ventory.test`;
    await page.goto('/register');
    await page.getByLabel('Full Name', { exact: true }).fill('Browser Admin');
    await page.getByLabel('Email Address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByLabel('Confirm Password', { exact: true }).fill('browser-password');
    await page.getByLabel('Shop Name', { exact: true }).fill(`Browser Shop ${suffix}`);
    await page.getByRole('button', { name: 'Register and Setup Shop' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    return suffix;
}

