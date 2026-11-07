import test from 'node:test';
import assert from 'node:assert/strict';
import { returnCredit } from '../../resources/js/Components/invoiceAmounts.js';

test('return estimates include invoice adjustments and allocate cumulative rounding', () => {
    assert.equal(returnCredit({ net_total: 280, quantity: 2 }, 1), 140);
    const item = { net_total: 1, quantity: 3, returned_quantity: 0, credited_total: 0 };
    const credits = [];
    for (let index = 0; index < 3; index++) {
        const credit = returnCredit(item, 1);
        credits.push(credit);
        item.returned_quantity++;
        item.credited_total += credit;
    }
    assert.deepEqual(credits, [0.3333, 0.3334, 0.3333]);
    assert.equal(returnCredit(item, 1), 0);
    assert.equal(returnCredit(item, ''), 0);
});
