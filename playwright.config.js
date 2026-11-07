import { defineConfig } from '@playwright/test';
import { testEnvironment } from './tests/browser/environment.js';

export default defineConfig({
    testDir: './tests/browser',
    globalSetup: './tests/browser/setup.js',
    workers: 1,
    timeout: 60000,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:8175',
        channel: 'msedge',
        headless: true,
        viewport: { width: 1440, height: 1000 },
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8175',
        url: 'http://127.0.0.1:8175/login',
        reuseExistingServer: false,
        timeout: 30000,
        env: testEnvironment,
    },
});
