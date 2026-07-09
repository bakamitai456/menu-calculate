import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc } from '../../src/domain/escape.js';

test('escapes HTML-significant characters', () => {
  assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('leaves safe text unchanged', () => {
  assert.equal(esc('plain text 123'), 'plain text 123');
});

test('coerces non-strings', () => {
  assert.equal(esc(42), '42');
});
