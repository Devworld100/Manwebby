require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const db = require('./db.js');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const resolvedPathCache = new Map();

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

  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { success: false, message: 'API endpoint not found' });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

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

    // 2. Support partial content for video/audio streaming (e.g. mp4)
    if (ext === '.mp4' || ext === '.webm') {
      const range = req.headers.range;
      const fileSize = stats.size;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800'
        });
        fileStream.pipe(res);
        return;
      }
    }

    // 3. Gzip compression for text, html, css, js, json, svg
    const isCompressible = /^(text\/|application\/javascript|application\/json|image\/svg\+xml)/.test(contentType);
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const canGzip = isCompressible && acceptEncoding.includes('gzip') && stats.size > 256;

    const cacheHeader = isStaticAsset 
      ? 'public, max-age=604800, stale-while-revalidate=86400' 
      : 'public, max-age=0, must-revalidate';

    if (canGzip) {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Encoding': 'gzip',
        'ETag': etag,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': cacheHeader,
        'Vary': 'Accept-Encoding'
      });
      const rawStream = fs.createReadStream(filePath);
      const gzipStream = zlib.createGzip({ level: 6 });
      rawStream.pipe(gzipStream).pipe(res);
      return;
    }

    // Uncompressed fallback
    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType,
      'ETag': etag,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheHeader
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/ (SQLite DB attached)`);
});
