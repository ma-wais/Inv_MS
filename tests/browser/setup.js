import { execFileSync } from 'node:child_process';
import { testEnvironment } from './environment.js';

export default function setup() {
    execFileSync('php', ['artisan', 'ventory:testing-accounts'], {
        env: { ...process.env, ...testEnvironment }, stdio: 'pipe', windowsHide: true,
    });
}
