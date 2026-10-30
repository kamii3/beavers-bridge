const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to protect admin routes
function requireAuth(req, res, next) {
  if (req.session && req.session.adminUser) {
    return next();
  }
  res.redirect('/login');
}

router.use(requireAuth);

// Helper for admin views
function getAdminContext(req, activeTab) {
  return {
    isAdmin: true,
    user: req.session.adminUser,
    activeTab,
    currentPath: req.baseUrl + req.path
  };
}

// ---------------------------------------------
// Admin Dashboard Overview
// ---------------------------------------------
router.get('/', (req, res) => {
  try {
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const testimonialCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get().count;
    const leadCount = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const newLeadCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'New'").get().count;
    const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;

    const recentLeads = db.prepare('SELECT * FROM leads ORDER BY id DESC LIMIT 6').all();
    const recentProjects = db.prepare('SELECT * FROM projects ORDER BY id DESC LIMIT 4').all();

    res.render('admin/dashboard', {
      ...getAdminContext(req, 'dashboard'),
      title: "Admin Dashboard | Beaver's Bridge",
      stats: {
        projects: projectCount,
        testimonials: testimonialCount,
        leads: leadCount,
        newLeads: newLeadCount,
        services: serviceCount
      },
      recentLeads,
      recentProjects
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Admin Server Error');
  }
});

// ---------------------------------------------
// Admin Projects Management
// ---------------------------------------------
router.get('/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id DESC').all();

    res.render('admin/projects', {
      ...getAdminContext(req, 'projects'),
      title: "Manage Projects & Case Studies | Beaver's Bridge Admin",
      projects
    });
  } catch (err) {
    console.error('Admin projects error:', err);
    res.status(500).send('Admin Server Error');
  }
});

// ---------------------------------------------
// Admin Testimonials Management
// ---------------------------------------------
router.get('/testimonials', (req, res) => {
  try {
    const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY sort_order ASC, id DESC').all();

    res.render('admin/testimonials', {
      ...getAdminContext(req, 'testimonials'),
      title: "Manage Testimonials | Beaver's Bridge Admin",
      testimonials
    });
  } catch (err) {
    console.error('Admin testimonials error:', err);
    res.status(500).send('Admin Server Error');
  }
});

// ---------------------------------------------
// Admin Inbound Leads Management
// ---------------------------------------------
router.get('/leads', (req, res) => {
  try {
    const statusFilter = req.query.status || 'all';
    let query = 'SELECT * FROM leads';
    let params = [];

    if (statusFilter !== 'all') {
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY id DESC';

    const leads = db.prepare(query).all(...params);
    const newCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'New'").get().count;

    res.render('admin/leads', {
      ...getAdminContext(req, 'leads'),
      title: "Inbound Leads & Strategy Sessions | Beaver's Bridge Admin",
      leads,
      statusFilter,
      newCount
    });
  } catch (err) {
    console.error('Admin leads error:', err);
    res.status(500).send('Admin Server Error');
  }
});

// ---------------------------------------------
// Admin Settings
// ---------------------------------------------
router.get('/settings', (req, res) => {
  try {
    const settings = db.getAllSettings();
    res.render('admin/settings', {
      ...getAdminContext(req, 'settings'),
      title: "Website Content & Portal Settings | Beaver's Bridge Admin",
      settings,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime())
    });
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).send('Admin Server Error');
  }
});

module.exports = router;
