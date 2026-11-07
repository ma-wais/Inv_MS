import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPhone, formatCnic } from '../../resources/js/Components/contactFormatting.js';

test('phone paste accepts local, international, spaced and dashed numbers', () => {
    for (const value of ['03001234567', '0300-1234567', '+92 300 1234567', '00923001234567', '923001234567']) {
        assert.equal(formatPhone(value), '300 1234567');
    }
    assert.equal(formatPhone(''), '');
    assert.equal(formatPhone('0300'), '300');
    assert.equal(formatPhone('0300123456789'), '300 1234567');
});

test('CNIC uses thirteen digits and two formatting separators', () => {
    assert.equal(formatCnic('3520212345671'), '35202-1234567-1');
    assert.equal(formatCnic('35202-1234567-1'), '35202-1234567-1');
    assert.equal(formatCnic('35202 1234567 1'), '35202-1234567-1');
    assert.equal(formatCnic('352021234567199'), '35202-1234567-1');
    assert.equal(formatCnic('352021'), '35202-1');
});
