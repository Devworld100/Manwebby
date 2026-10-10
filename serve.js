const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db.js');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

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
      database: 'SQLite (node:sqlite WAL)',
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const user = db.authenticateUser(body.username, body.password);
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
    const profiles = db.getAllProfiles();
    sendJson(res, 200, { success: true, profiles });
    return true;
  }

  // POST /api/profiles (Create)
  if (pathname === '/api/profiles' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const profile = db.createProfile(body);
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
      const updated = db.reassignProfile(profileId, body);
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
      const profile = db.getProfileById(profileId);
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
        const updated = db.updateProfile(profileId, body);
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
      const ok = db.deleteProfile(profileId);
      sendJson(res, ok ? 200 : 404, { success: ok });
      return true;
    }
  }

  // POST /api/collection-notice
  if (pathname === '/api/collection-notice' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const result = db.createCollectionNotice(body);
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

  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT, safePath);

  // Fallback lookup in organized folders if not found in root directly
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

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Support partial content for video/audio streaming (e.g. mp4)
    if (ext === '.mp4') {
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
          'Content-Type': contentType
        });
        fileStream.pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/ (SQLite DB attached)`);
});
