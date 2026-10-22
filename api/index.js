const app = require('../server/index');

module.exports = (req, res) => {
  // If Vercel rewrote URL to /api/index.js or /api, restore real path
  if (req.url.startsWith('/api/index.js') || req.url === '/api') {
    const realPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
    if (realPath) {
      req.url = realPath;
    }
  }
  return app(req, res);
};
