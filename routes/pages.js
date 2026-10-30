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
// 1. HOME PAGE
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
      title: "Beaver's Bridge | Organic Community Lead Generation & Brand Authority",
      description: "Unlock high-intent organic leads and establish an undeniable community presence without burning budget on ads. Modeled after elite community growth frameworks.",
      services,
      projects,
      testimonials
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).send('Server Error');
  }
});

// ---------------------------------------------
// 2. ABOUT US PAGE
// ---------------------------------------------
router.get('/about', (req, res) => {
  try {
    const testimonials = db.prepare('SELECT * FROM testimonials WHERE featured = 1 ORDER BY sort_order ASC LIMIT 3').all();

    res.render('about', {
      ...getCommonContext(req),
      title: "About Beaver's Bridge | Crafting Community Trust & Sustainable Growth",
      description: "Learn how Beaver's Bridge was founded on the principle that the most resilient businesses are trusted community pillars, not noisy advertisers.",
      testimonials
    });
  } catch (err) {
    console.error('About page error:', err);
    res.status(500).send('Server Error');
  }
});

// ---------------------------------------------
// 3. SERVICES PAGE
// ---------------------------------------------
router.get('/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all().map(s => ({
      ...s,
      deliverables: JSON.parse(s.deliverables || '[]')
    }));

    res.render('services', {
      ...getCommonContext(req),
      title: "Services & Systems | Beaver's Bridge Community Acquisition",
      description: "Explore our proven 6-pillar organic community system: group intelligence, authority copywriting, active peer nurturing, and high-conversion lead harvesting.",
      services
    });
  } catch (err) {
    console.error('Services page error:', err);
    res.status(500).send('Server Error');
  }
});

// ---------------------------------------------
// 4. PROJECTS / PORTFOLIO PAGE
// ---------------------------------------------
router.get('/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id DESC').all();
    
    // Extract unique categories
    const categories = ['All', ...new Set(projects.map(p => p.category))];

    res.render('projects', {
      ...getCommonContext(req),
      title: "Projects & Proven Results | Beaver's Bridge Portfolio",
      description: "Real case studies, verified metrics, and revenue generated through our organic community lead generation systems.",
      projects,
      categories
    });
  } catch (err) {
    console.error('Projects page error:', err);
    res.status(500).send('Server Error');
  }
});

// ---------------------------------------------
// 5. CONTACT & BOOKING PAGE
// ---------------------------------------------
router.get('/contact', (req, res) => {
  try {
    const services = db.prepare('SELECT id, title FROM services ORDER BY sort_order ASC').all();

    res.render('contact', {
      ...getCommonContext(req),
      title: "Schedule Your Free Strategy Session | Beaver's Bridge",
      description: "Book your 1-on-1 organic growth strategy session and discover how to capture high-intent community leads in your local market.",
      services
    });
  } catch (err) {
    console.error('Contact page error:', err);
    res.status(500).send('Server Error');
  }
});

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
