const path = require('path');
const os = require('os');

// Configure serverless runtime variables for Vercel
process.env.VERCEL = '1';
process.env.APP_ROOT = process.cwd();
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'beavers-bridge-uploads');

const app = require('../server');

module.exports = app;
