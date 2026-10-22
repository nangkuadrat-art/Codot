let app = null;
let initError = null;

try {
  app = require('../server/index');
} catch (err) {
  initError = err;
  console.error('Server init failed:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      message: 'Server gagal inisialisasi: ' + initError.message,
      code: initError.code || null
    }));
    return;
  }
  return app(req, res);
};
