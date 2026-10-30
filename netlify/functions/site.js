const path = require('path');
const os = require('os');
const serverless = require('serverless-http');

// Netlify places the function bundle under /var/task/netlify/functions.
process.env.NETLIFY = 'true';
process.env.APP_ROOT = process.env.LAMBDA_TASK_ROOT || path.resolve(__dirname, '../..');
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'beavers-bridge-uploads');

const app = require('../../server');

exports.handler = serverless(app, { basePath: '/.netlify/functions/site' });
