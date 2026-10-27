require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const db = require('./db.js');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const resolvedPathCache = new Map();
const staticGzipCache = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 15e6) {
        reject(new Error('Payload too large (15MB limit)'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

async function handleApiRequest(req, res, pathname) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  // GET /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      version: '1.0.1',
      engine: 'MAN Commercial Secure API',
      database: db.getEngineName(),
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const user = await db.authenticateUser(body.username, body.password);
      if (!user) {
        sendJson(res, 401, { success: false, message: 'Invalid username/email or password.' });
        return true;
      }
      sendJson(res, 200, {
        success: true,
        user: {
          id: (user.profile && user.profile.id) ? user.profile.id : user.id,
          profile_id: user.profile ? user.profile.id : null,
          auth_user_id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile || null,
          ...(user.profile || {})
        }
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, message: err.message });
      return true;
    }
  }

  // GET /api/profiles
  if (pathname === '/api/profiles' && req.method === 'GET') {
    const profiles = await db.getAllProfiles();
    sendJson(res, 200, { success: true, profiles });
    return true;
  }

  // POST /api/profiles (Create)
  if (pathname === '/api/profiles' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const profile = await db.createProfile(body);
      sendJson(res, 201, { success: true, profile });
      return true;
    } catch (err) {
      console.error('[API Create Profile Error]:', err.message);
      sendJson(res, 400, { success: false, message: err.message });
      return true;
    }
  }

  // Route: /api/profiles/:id/reassign
  const reassignMatch = pathname.match(/^\/api\/profiles\/([^/]+)\/reassign$/);
  if (reassignMatch && req.method === 'POST') {
    try {
      const profileId = reassignMatch[1];
      const body = await readJsonBody(req);
      const updated = await db.reassignProfile(profileId, body);
      if (!updated) {
        sendJson(res, 404, { success: false, message: 'Profile not found' });
        return true;
      }
      sendJson(res, 200, { success: true, profile: updated });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, message: err.message });
      return true;
    }
  }

  // Route: /api/profiles/:id (GET, PUT, DELETE)
  const profileMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);
  if (profileMatch) {
    const profileId = profileMatch[1];

    if (req.method === 'GET') {
      const profile = await db.getProfileById(profileId);
      if (!profile) {
        sendJson(res, 404, { success: false, message: 'Profile not found' });
      } else {
        sendJson(res, 200, { success: true, profile });
      }
      return true;
    }

    if (req.method === 'PUT') {
      try {
        const body = await readJsonBody(req);
        const updated = await db.updateProfile(profileId, body);
        if (!updated) {
          sendJson(res, 404, { success: false, message: 'Profile not found' });
        } else {
          sendJson(res, 200, { success: true, profile: updated });
        }
        return true;
      } catch (err) {
        sendJson(res, 400, { success: false, message: err.message });
        return true;
      }
    }

    if (req.method === 'DELETE') {
      const ok = await db.deleteProfile(profileId);
      sendJson(res, ok ? 200 : 404, { success: ok });
      return true;
    }
  }

  // POST /api/collection-notice
  if (pathname === '/api/collection-notice' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = await db.createCollectionNotice(body);
      sendJson(res, 200, { success: true, result });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, message: err.message });
      return true;
    }
  }

  // POST /api/upload (Image file storage)
  if (pathname === '/api/upload' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const rawData = body.image || body.data;
      if (!rawData) {
        sendJson(res, 400, { success: false, message: 'No image data provided.' });
        return true;
      }

      // If already a remote or assets URL, echo it
      if (typeof rawData === 'string' && (rawData.startsWith('http://') || rawData.startsWith('https://') || rawData.startsWith('/assets/'))) {
        sendJson(res, 200, { success: true, url: rawData });
        return true;
      }

      const matches = String(rawData).match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!matches) {
        sendJson(res, 400, { success: false, message: 'Invalid image payload. Expected base64 Data URI.' });
        return true;
      }

      let subType = matches[1].toLowerCase();
      if (subType === 'jpeg') subType = 'jpg';
      if (!['png', 'jpg', 'webp', 'gif'].includes(subType)) {
        subType = 'jpg';
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const crypto = require('crypto');
      const safeId = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
      const fileName = `avatar-${safeId}.${subType}`;
      const uploadDir = path.join(ROOT, 'assets', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const targetPath = path.join(uploadDir, fileName);
      fs.writeFileSync(targetPath, buffer);

      // Invalidate resolved cache
      resolvedPathCache.delete(`assets/uploads/${fileName}`);
      resolvedPathCache.delete(`/assets/uploads/${fileName}`);

      const publicUrl = `/assets/uploads/${fileName}`;
      sendJson(res, 200, {
        success: true,
        url: publicUrl,
        filename: fileName,
        size: buffer.length
      });
      return true;
    } catch (err) {
      sendJson(res, 500, { success: false, message: err.message });
      return true;
    }
  }

  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { success: false, message: 'API endpoint not found' });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    let parsedUrl;
    try {
      // Normalize URL: strip multiple leading slashes (e.g. "//?author=1" or "///")
      // which WHATWG URL parser interprets as protocol-relative with an empty host
      let rawUrl = (req.url || '/').trim();
      if (rawUrl.startsWith('//')) {
        rawUrl = '/' + rawUrl.replace(/^\/+/, '');
      }
      parsedUrl = new URL(rawUrl, 'http://127.0.0.1');
    } catch (urlErr) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('400 Bad Request');
      return;
    }

    let pathname = parsedUrl.pathname;
    try {
      pathname = decodeURIComponent(pathname);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('400 Bad Request');
      return;
    }

  // Handle REST API requests
  if (pathname.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res, pathname);
    if (handled) return;
  }

  // 1. Clean URL Canonical Redirects
  if (pathname === '/index.html') {
    res.writeHead(301, { 'Location': '/home' + (parsedUrl.search || '') });
    res.end();
    return;
  }

  if (pathname.endsWith('.html')) {
    const rawName = pathname.slice(1, -5);
    const targetFile = path.join(ROOT, rawName + '.html');
    if (fs.existsSync(targetFile)) {
      const dest = rawName === 'index' ? '/home' : ('/' + rawName);
      res.writeHead(301, { 'Location': dest + (parsedUrl.search || '') });
      res.end();
      return;
    }
  }

  // 2. Map Clean URLs to physical HTML files
  if (pathname === '/' || pathname === '/home') {
    pathname = '/index.html';
  } else if (!path.extname(pathname)) {
    const pageName = pathname.replace(/^\//, '');
    const candidateHtml = path.join(ROOT, pageName + '.html');
    if (fs.existsSync(candidateHtml)) {
      pathname = '/' + pageName + '.html';
    }
  }

  // Prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = resolvedPathCache.get(safePath);

  if (!filePath) {
    filePath = path.join(ROOT, safePath);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
      const candidatePaths = [
        path.join(ROOT, 'assets', 'uploads', path.basename(safePath)),
        path.join(ROOT, 'assets', 'images', safePath),
        path.join(ROOT, 'assets', 'videos', safePath),
        path.join(ROOT, 'docs', safePath),
        path.join(ROOT, 'docs', 'screenshots', safePath)
      ];
      for (const cand of candidatePaths) {
        if (fs.existsSync(cand) && fs.statSync(cand, { throwIfNoEntry: false })?.isFile()) {
          filePath = cand;
          break;
        }
      }
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
      resolvedPathCache.set(safePath, filePath);
    }
  }

    fs.stat(filePath, (err, stats) => {
      try {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';
    const isStaticAsset = !isHtml && ext !== '.json';

    // 1. ETag & 304 Not Modified validation (Instant responses)
    const etag = `W/"${stats.size}-${Math.floor(stats.mtimeMs)}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, {
        'ETag': etag,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': isStaticAsset ? 'public, max-age=604800, stale-while-revalidate=86400' : 'public, max-age=0, must-revalidate'
      });
      res.end();
      return;
    }

    // 2. Video & Audio streaming with full Range & Accept-Ranges support
    if (ext === '.mp4' || ext === '.webm') {
      const fileSize = stats.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
          res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes'
          });
          return res.end();
        }

        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=2592000'
        });

        fileStream.on('error', () => {
          if (!res.headersSent) res.writeHead(500);
          res.end();
        });
        fileStream.pipe(res);
        return;
      } else {
        // Complete video without range request - MUST provide Accept-Ranges for HTML5 media players
        res.writeHead(200, {
          'Accept-Ranges': 'bytes',
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=2592000'
        });
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', () => {
          if (!res.headersSent) res.writeHead(500);
          res.end();
        });
        fileStream.pipe(res);
        return;
      }
    }

    // 3. In-memory Gzip compression cache for HTML, CSS, JS, JSON, SVG
    const isCompressible = /^(text\/|application\/javascript|application\/json|image\/svg\+xml)/.test(contentType);
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const canGzip = isCompressible && acceptEncoding.includes('gzip') && stats.size > 256;

    const cacheHeader = isStaticAsset 
      ? 'public, max-age=604800, stale-while-revalidate=86400' 
      : 'public, max-age=0, must-revalidate';

    if (canGzip) {
      let cached = staticGzipCache.get(filePath);
      if (!cached || cached.mtime !== stats.mtimeMs) {
        try {
          const rawBuf = fs.readFileSync(filePath);
          const gzBuf = zlib.gzipSync(rawBuf, { level: 6 });
          cached = { mtime: stats.mtimeMs, buf: gzBuf };
          staticGzipCache.set(filePath, cached);
        } catch (e) {
          cached = null;
        }
      }

      if (cached) {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Encoding': 'gzip',
          'Content-Length': cached.buf.length,
          'ETag': etag,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': cacheHeader,
          'Vary': 'Accept-Encoding'
        });
        res.end(cached.buf);
        return;
      }
    }

    // Uncompressed fallback with explicit Content-Length
    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType,
      'ETag': etag,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheHeader
    });
      const fallbackStream = fs.createReadStream(filePath);
      fallbackStream.on('error', () => res.end());
      fallbackStream.pipe(res);
    } catch (statErr) {
      console.error('[Static File Serving Error]:', statErr);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    }
  });
} catch (serverErr) {
  console.error('[Server Request Error]:', serverErr);
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
}
});

process.on('uncaughtException', (err) => {
  console.error('[Process UncaughtException]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process UnhandledRejection]:', reason);
});

// Render Keep-Alive: Ping service every 10 minutes to prevent free-tier spin down
const PING_INTERVAL_MS = 10 * 60 * 1000;
const KEEP_ALIVE_URL = process.env.PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://mancommercialsprotection.co.uk';

setInterval(() => {
  try {
    const healthUrl = `${KEEP_ALIVE_URL}/api/health`;
    const protocol = healthUrl.startsWith('https') ? require('https') : require('http');
    protocol.get(healthUrl, (pingRes) => {
      pingRes.resume();
    }).on('error', () => {});
  } catch (err) {}
}, PING_INTERVAL_MS);

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}/ (${db.getEngineName()})`);
  await db.ensureSeedData();
});
