import {readFile, access} from 'node:fs/promises';
import assert from 'node:assert/strict';
const html=await readFile('index.html','utf8');
for(const match of html.matchAll(/(?:href|src)="(\.\/[^"#]+)"/g))await access(match[1]);
for(const route of ['overview','gas-prices','elections','culture','crypto','golf','portfolio','summary','review'])assert.ok(html.includes(`data-route="${route}"`),`Missing navigation ${route}`);
const app=await readFile('src/app.js','utf8');for(const route of ['overview','portfolio','summary','review'])assert.ok(app.includes(route));
console.log('Static site checks passed (local assets and navigation).');
