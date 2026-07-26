import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isInternalUrl, isSafeExternalUrl, type UrlPolicy } from './url-policy.js';

const dev: UrlPolicy = { devOrigin: 'http://localhost:5173', rendererDir: '/unused' };

const rendererDir = path.normalize(path.resolve('/app/dist'));
const packaged: UrlPolicy = { devOrigin: null, rendererDir };

describe('isInternalUrl in development', () => {
  it('allows the dev server itself', () => {
    expect(isInternalUrl('http://localhost:5173/', dev)).toBe(true);
    expect(isInternalUrl('http://localhost:5173/index.html', dev)).toBe(true);
  });

  // The reason this function exists. Each of these passes a naive
  // `url.startsWith('http://localhost:5173')` test while pointing somewhere else,
  // which would load a remote page into a window holding the preload bridge.
  it.each([
    ['userinfo before the real host', 'http://localhost:5173@evil.example/steal'],
    ['a longer port number', 'http://localhost:51730/'],
    ['the origin as a subdomain prefix', 'http://localhost:5173.evil.example/'],
    ['a different host entirely', 'http://evil.example/'],
    ['https against an http dev server', 'https://localhost:5173/'],
  ])('rejects %s', (_label, url) => {
    expect(isInternalUrl(url, dev)).toBe(false);
  });

  it('rejects a malformed URL rather than throwing', () => {
    expect(isInternalUrl('not a url', dev)).toBe(false);
    expect(isInternalUrl('', dev)).toBe(false);
  });
});

describe('isInternalUrl in a packaged build', () => {
  it('allows files inside the renderer directory', () => {
    const index = pathToFileURL(path.join(rendererDir, 'index.html')).href;
    expect(isInternalUrl(index, packaged)).toBe(true);
  });

  it('allows nested asset paths', () => {
    const asset = pathToFileURL(path.join(rendererDir, 'assets', 'index.js')).href;
    expect(isInternalUrl(asset, packaged)).toBe(true);
  });

  it('rejects files outside the renderer directory', () => {
    const outside = pathToFileURL(path.resolve('/app/secrets.txt')).href;
    expect(isInternalUrl(outside, packaged)).toBe(false);
  });

  it('rejects a sibling directory that merely shares the name as a prefix', () => {
    // /app/dist-evil must not pass because it starts with /app/dist.
    const sibling = pathToFileURL(path.resolve('/app/dist-evil/index.html')).href;
    expect(isInternalUrl(sibling, packaged)).toBe(false);
  });

  it('rejects traversal back out of the renderer directory', () => {
    const traversal = pathToFileURL(path.join(rendererDir, '..', 'secrets.txt')).href;
    expect(isInternalUrl(traversal, packaged)).toBe(false);
  });

  it('rejects remote URLs', () => {
    expect(isInternalUrl('http://evil.example/', packaged)).toBe(false);
    expect(isInternalUrl('https://evil.example/', packaged)).toBe(false);
  });
});

describe('isSafeExternalUrl', () => {
  it('allows web content', () => {
    expect(isSafeExternalUrl('https://open-meteo.com/en/docs')).toBe(true);
    expect(isSafeExternalUrl('http://example.com/')).toBe(true);
  });

  // shell.openExternal runs the OS handler for the scheme it is given, so these
  // would be local code execution rather than a link.
  it.each([
    ['ms-msdt:/id PCWDiagnostic'],
    ['search-ms:query=passwords'],
    ['file:///C:/Windows/System32/calc.exe'],
    ['javascript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['vbscript:msgbox(1)'],
  ])('refuses %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(false);
  });

  it('refuses a malformed URL rather than throwing', () => {
    expect(isSafeExternalUrl('nonsense')).toBe(false);
  });
});
