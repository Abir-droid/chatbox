'use strict';

const dns = require('node:dns').promises;
const path = require('node:path');

// In-memory cache: url -> { data, expiresAt }
const previewCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for successful previews
const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for errors
const MAX_CACHE_ENTRIES = 1000;
const MAX_BYTES = 131072; // 128 KB max to read for meta tags

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip === 'localhost') return true;

  // IPv4 check
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (172.16.0.0 – 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 100.64.0.0/10 (carrier NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (test nets)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;
    if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;
    if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;
    // 224.0.0.0/4 (multicast) & 240.0.0.0/4 (reserved)
    if (parts[0] >= 224) return true;
    return false;
  }

  // IPv6 check
  const cleanV6 = ip.toLowerCase();
  if (
    cleanV6 === '::1' ||
    cleanV6 === '::' ||
    cleanV6.startsWith('fe80:') ||
    cleanV6.startsWith('fc00:') ||
    cleanV6.startsWith('fd00:') ||
    cleanV6.startsWith('::ffff:127.') ||
    cleanV6.startsWith('::ffff:10.') ||
    cleanV6.startsWith('::ffff:192.168.')
  ) {
    return true;
  }

  return false;
}

async function validateAndResolveUrl(urlStr) {
  let u = String(urlStr || '').trim();
  if (!u) throw new Error('Empty URL');
  if (/^www\./i.test(u)) {
    u = 'https://' + u;
  }

  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Unsupported protocol: only http and https are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.arpa')
  ) {
    throw new Error('Access to local domains is prohibited');
  }

  // DNS resolution to protect against SSRF & DNS rebinding
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error('Host could not be resolved');
    }
    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        throw new Error('Access to private network IP addresses is prohibited');
      }
    }
  } catch (err) {
    if (err.message && err.message.includes('prohibited')) throw err;
    throw new Error(`DNS resolution failed for ${hostname}: ${err.message}`);
  }

  return parsed;
}

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMetaTag(html, propertyOrNames) {
  for (const name of propertyOrNames) {
    // Regex for property="..." content="..."
    const p1 = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
    const m1 = html.match(p1);
    if (m1 && m1[1]) return decodeHtmlEntities(m1[1]);

    // Regex for content="..." property="..."
    const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, 'i');
    const m2 = html.match(p2);
    if (m2 && m2[1]) return decodeHtmlEntities(m2[1]);
  }
  return null;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m && m[1] ? decodeHtmlEntities(m[1]) : null;
}

async function fetchLinkPreview(targetUrl) {
  const cacheKey = String(targetUrl || '').trim();
  const cached = previewCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  let currentUrl = targetUrl;
  let redirectCount = 0;
  const maxRedirects = 3;

  while (redirectCount <= maxRedirects) {
    const parsed = await validateAndResolveUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let res;
    try {
      res = await fetch(parsed.href, {
        method: 'GET',
        headers: {
          'User-Agent':
            'WhatsApp/2.23.20.0 i (compatible; ChatboxBot/1.0; +https://chatbox.app)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'manual', // Manually validate each redirect destination to prevent SSRF
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    // Handle redirects manually to validate destination IPs
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirect with no location header');
      currentUrl = new URL(location, parsed.href).href;
      redirectCount++;
      continue;
    }

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const domain = parsed.hostname.replace(/^www\./i, '');

    // Direct Image URL preview
    if (contentType.startsWith('image/')) {
      const filename = path.basename(parsed.pathname) || 'Image';
      const preview = {
        url: parsed.href,
        domain,
        title: filename,
        description: null,
        image: parsed.href,
        siteName: domain,
      };
      setCache(cacheKey, { ok: true, preview }, CACHE_TTL_MS);
      return { ok: true, preview };
    }

    // Only parse HTML / XHTML
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Non-HTML content-type: ${contentType}`);
    }

    // Read first chunk (up to MAX_BYTES) for meta tags
    const reader = res.body.getReader();
    let receivedBytes = 0;
    const chunks = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        chunks.push(value);
        receivedBytes += value.length;
        if (receivedBytes >= MAX_BYTES) {
          try { await reader.cancel(); } catch {}
          break;
        }
      }
    } catch {}

    const totalBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const html = totalBuffer.toString('utf-8');

    // Extract OpenGraph, Twitter and Fallback metadata
    let title =
      extractMetaTag(html, ['og:title', 'twitter:title']) ||
      extractTitle(html);
    let description =
      extractMetaTag(html, ['og:description', 'twitter:description', 'description']);
    let image =
      extractMetaTag(html, ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']);
    let siteName =
      extractMetaTag(html, ['og:site_name', 'twitter:site']) || domain;

    // Resolve relative image URLs
    if (image) {
      try {
        const imgUrl = new URL(image, parsed.href);
        if (imgUrl.protocol === 'http:' || imgUrl.protocol === 'https:') {
          image = imgUrl.href;
        } else {
          image = null;
        }
      } catch {
        image = null;
      }
    }

    // Clean and truncate
    if (title && title.length > 150) {
      title = title.slice(0, 147) + '…';
    }
    if (description && description.length > 250) {
      description = description.slice(0, 247) + '…';
    }

    const isYouTube = domain === 'youtube.com' || domain === 'youtu.be' || domain.endsWith('.youtube.com');
    if (isYouTube) {
      siteName = 'YouTube';
      domain = 'youtube.com';
      if (title) title = title.replace(/\s*-\s*YouTube$/i, '').trim();
    }

    // If neither title nor image found, we don't have enough for a useful preview
    if (!title && !image && !description) {
      throw new Error('No OpenGraph or HTML title metadata found');
    }

    const preview = {
      url: parsed.href,
      domain,
      title: title || domain,
      description: description || null,
      image: image || null,
      siteName: siteName || domain,
    };

    setCache(cacheKey, { ok: true, preview }, CACHE_TTL_MS);
    return { ok: true, preview };
  }

  throw new Error('Too many redirects');
}

function setCache(key, data, ttl) {
  if (previewCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest 100 entries
    const iter = previewCache.keys();
    for (let i = 0; i < 100; i++) {
      const nextKey = iter.next().value;
      if (!nextKey) break;
      previewCache.delete(nextKey);
    }
  }
  previewCache.set(key, { data, expiresAt: Date.now() + ttl });
}

module.exports = {
  fetchLinkPreview,
  validateAndResolveUrl,
  isPrivateIp,
  previewCache,
};
