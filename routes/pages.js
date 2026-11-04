const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Helper to get active site settings or general context
function getCommonContext(req) {
  return {
    isAdmin: !!(req.session && req.session.adminUser),
    currentPath: req.path
  };
}

// ---------------------------------------------
// 1. HOME / PORTFOLIO SHOWCASE PAGE
// ---------------------------------------------
router.get('/', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all().map(s => ({
      ...s,
      deliverables: JSON.parse(s.deliverables || '[]')
    }));

    const projects = db.prepare('SELECT * FROM projects WHERE featured = 1 ORDER BY sort_order ASC, id DESC LIMIT 6').all();
    const testimonials = db.prepare('SELECT * FROM testimonials WHERE featured = 1 ORDER BY sort_order ASC, id DESC').all();

    res.render('index', {
      ...getCommonContext(req),
      title: "Beaver's Bridge | Organic Facebook Lead Generation & Marketing Agency",
      description: "Organic Facebook lead generation and marketing agency for local service businesses. High-intent local leads without wasting money on ads.",
      services,
      projects,
      testimonials
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).send('Server Error');
  }
});

// Single-page portfolio redirects for clean, non-rushed UX
router.get('/about', (req, res) => res.redirect('/#benefits'));
router.get('/services', (req, res) => res.redirect('/#features'));
router.get('/projects', (req, res) => res.redirect('/#portfolio'));
router.get('/contact', (req, res) => res.redirect('/#contact'));

// ---------------------------------------------
// 6. LOGIN / AUTHENTICATION
// ---------------------------------------------
router.get('/login', (req, res) => {
  if (req.session && req.session.adminUser) {
    return res.redirect('/admin');
  }
  res.render('login', {
    ...getCommonContext(req),
    title: "Admin Portal Login | Beaver's Bridge",
    error: req.query.error || null
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', {
      ...getCommonContext(req),
      title: "Admin Portal Login | Beaver's Bridge",
      error: 'Please enter both username and password.'
    });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render('login', {
      ...getCommonContext(req),
      title: "Admin Portal Login | Beaver's Bridge",
      error: 'Invalid username or password. Please try again.'
    });
  }

  req.session.adminUser = {
    id: user.id,
    username: user.username
  };

  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
