require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const isServerless = !!(
  process.env.NETLIFY ||
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);
const appRoot = process.env.APP_ROOT || process.cwd();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(appRoot, 'views'));

// Body parsers
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Static files (disable default index.html serving so dynamic EJS route handles /)
app.use(express.static(path.join(appRoot, 'public'), { index: false }));
if (isServerless) {
  app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(require('os').tmpdir(), 'beavers-bridge-uploads')));
}

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Global view variables
app.use((req, res, next) => {
  res.locals.adminUser = req.session ? req.session.adminUser : null;
  res.locals.siteName = "Beaver's Bridge";
  res.locals.year = new Date().getFullYear();
  res.locals.settings = db.getAllSettings();
  next();
});

// Routes
const pageRoutes = require('./routes/pages');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/', pageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: "Page Not Found | Beaver's Bridge",
    description: "The page you are looking for does not exist.",
    isAdmin: !!(req.session && req.session.adminUser),
    currentPath: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).render('500', {
    title: "Server Error | Beaver's Bridge",
    description: "An unexpected error occurred. Please try again shortly.",
    isAdmin: !!(req.session && req.session.adminUser),
    currentPath: req.path,
    error: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

if (!isServerless) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🌲 Beaver's Bridge Platform running at http://localhost:${PORT}`);
    console.log(`🔑 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
