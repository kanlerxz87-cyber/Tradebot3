import test from 'node:test';
import assert from 'node:assert/strict';
import {category, priceChange, number, price, marketRows, marketUrl, escapeHtml} from '../src/core.js';
test('category uses exact official labels only',()=>{assert.equal(category({category:'Crypto'}),'crypto');assert.equal(category({category:'Sports',title:'Golf'}),null);});
test('alerts include boundary both ways and ignore absent data',()=>{assert.equal(priceChange(.2,.3),.1);assert.equal(priceChange(.3,.2),-.1);assert.equal(priceChange(.2,.2999),null);assert.equal(priceChange(null,.3),null);});
test('missing numbers stay missing',()=>{assert.equal(number(''),null);assert.equal(price(null),'—');assert.equal(price('0.0000'),'$0.00');});
test('only requested categories and ticker rows are returned',()=>{const rows=marketRows([{category:'Crypto',markets:[{ticker:'ABC'},{}]},{category:'Sports',markets:[{ticker:'GOLF'}]}]);assert.equal(rows.length,1);assert.equal(rows[0].ticker,'ABC');});
test('source URLs are encoded and strings escaped',()=>{assert.match(marketUrl('A/B'),/A%2FB$/);assert.equal(escapeHtml('<script>'), '&lt;script&gt;');});
