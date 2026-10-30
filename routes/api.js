const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../db');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}-${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WEBP, SVG, GIF) are allowed'));
  }
});

// Middleware to check admin session
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUser) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized: Admin session required' });
}

// ---------------------------------------------
// PUBLIC API: Submit Consultation / Lead Form
// ---------------------------------------------
router.post('/leads', (req, res) => {
  try {
    const { name, email, phone, company, website, service_needed, monthly_budget, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO leads (name, email, phone, company, website, service_needed, monthly_budget, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      email.trim(),
      (phone || '').trim(),
      (company || '').trim(),
      (website || '').trim(),
      (service_needed || 'General Inquiry').trim(),
      (monthly_budget || 'Not specified').trim(),
      (message || '').trim()
    );

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Thank you! Your strategy session request has been received. Our team will connect with you within 24 hours.'
    });
  } catch (err) {
    console.error('Lead submission error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit inquiry. Please try again.' });
  }
});

// ---------------------------------------------
// ADMIN API: Projects CRUD
// ---------------------------------------------

// Create Project
router.post('/projects', requireAdmin, upload.single('image_file'), (req, res) => {
  try {
    const { title, client, category, summary, challenge, solution, metrics, image_url, live_url, featured, sort_order } = req.body;

    if (!title || !client || !category || !summary || !metrics) {
      return res.status(400).json({ success: false, error: 'Please provide all required project fields.' });
    }

    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    if (!finalImageUrl) {
      finalImageUrl = '/images/projects/remodel.jpg'; // fallback
    }

    const stmt = db.prepare(`
      INSERT INTO projects (title, client, category, summary, challenge, solution, metrics, image_url, live_url, featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      client.trim(),
      category.trim(),
      summary.trim(),
      (challenge || '').trim(),
      (solution || '').trim(),
      metrics.trim(),
      finalImageUrl.trim(),
      (live_url || '').trim(),
      featured ? 1 : 0,
      parseInt(sort_order) || 0
    );

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Project created successfully!'
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ success: false, error: 'Failed to create project.' });
  }
});

// Update Project
router.put('/projects/:id', requireAdmin, upload.single('image_file'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, client, category, summary, challenge, solution, metrics, image_url, live_url, featured, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    let finalImageUrl = existing.image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (image_url && image_url.trim()) {
      finalImageUrl = image_url.trim();
    }

    const stmt = db.prepare(`
      UPDATE projects
      SET title = ?, client = ?, category = ?, summary = ?, challenge = ?, solution = ?, metrics = ?, image_url = ?, live_url = ?, featured = ?, sort_order = ?
      WHERE id = ?
    `);

    stmt.run(
      (title || existing.title).trim(),
      (client || existing.client).trim(),
      (category || existing.category).trim(),
      (summary || existing.summary).trim(),
      challenge !== undefined ? challenge.trim() : existing.challenge,
      solution !== undefined ? solution.trim() : existing.solution,
      (metrics || existing.metrics).trim(),
      finalImageUrl,
      live_url !== undefined ? live_url.trim() : existing.live_url,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      sort_order !== undefined ? parseInt(sort_order) : existing.sort_order,
      id
    );

    res.json({ success: true, message: 'Project updated successfully!' });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ success: false, error: 'Failed to update project.' });
  }
});

// Delete Project
router.delete('/projects/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete project.' });
  }
});

// ---------------------------------------------
// ADMIN API: Testimonials CRUD
// ---------------------------------------------
router.post('/testimonials', requireAdmin, upload.single('avatar_file'), (req, res) => {
  try {
    const { client_name, client_role, client_company, avatar_url, quote, highlight_metric, rating, featured, sort_order } = req.body;

    if (!client_name || !client_role || !quote || !highlight_metric) {
      return res.status(400).json({ success: false, error: 'Please provide all required testimonial fields.' });
    }

    let finalAvatar = avatar_url;
    if (req.file) {
      finalAvatar = `/uploads/${req.file.filename}`;
    }
    if (!finalAvatar) {
      finalAvatar = '/images/avatars/justin.jpg';
    }

    const stmt = db.prepare(`
      INSERT INTO testimonials (client_name, client_role, client_company, avatar_url, quote, highlight_metric, rating, featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      client_name.trim(),
      client_role.trim(),
      (client_company || '').trim(),
      finalAvatar.trim(),
      quote.trim(),
      highlight_metric.trim(),
      parseInt(rating) || 5,
      featured ? 1 : 0,
      parseInt(sort_order) || 0
    );

    res.json({ success: true, id: result.lastInsertRowid, message: 'Testimonial added successfully!' });
  } catch (err) {
    console.error('Create testimonial error:', err);
    res.status(500).json({ success: false, error: 'Failed to add testimonial.' });
  }
});

router.put('/testimonials/:id', requireAdmin, upload.single('avatar_file'), (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, client_role, client_company, avatar_url, quote, highlight_metric, rating, featured, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Testimonial not found.' });
    }

    let finalAvatar = existing.avatar_url;
    if (req.file) {
      finalAvatar = `/uploads/${req.file.filename}`;
    } else if (avatar_url && avatar_url.trim()) {
      finalAvatar = avatar_url.trim();
    }

    const stmt = db.prepare(`
      UPDATE testimonials
      SET client_name = ?, client_role = ?, client_company = ?, avatar_url = ?, quote = ?, highlight_metric = ?, rating = ?, featured = ?, sort_order = ?
      WHERE id = ?
    `);

    stmt.run(
      (client_name || existing.client_name).trim(),
      (client_role || existing.client_role).trim(),
      client_company !== undefined ? client_company.trim() : existing.client_company,
      finalAvatar,
      (quote || existing.quote).trim(),
      (highlight_metric || existing.highlight_metric).trim(),
      rating !== undefined ? parseInt(rating) : existing.rating,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      sort_order !== undefined ? parseInt(sort_order) : existing.sort_order,
      id
    );

    res.json({ success: true, message: 'Testimonial updated successfully!' });
  } catch (err) {
    console.error('Update testimonial error:', err);
    res.status(500).json({ success: false, error: 'Failed to update testimonial.' });
  }
});

router.delete('/testimonials/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Testimonial not found' });
    }
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (err) {
    console.error('Delete testimonial error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete testimonial.' });
  }
});

// ---------------------------------------------
// ADMIN API: Leads Status Management
// ---------------------------------------------
router.put('/leads/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['New', 'Contacted', 'Qualified', 'Closed', 'Archived'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status.' });
    }

    const stmt = db.prepare('UPDATE leads SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }

    res.json({ success: true, message: `Lead status updated to ${status}.` });
  } catch (err) {
    console.error('Update lead status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update lead status.' });
  }
});

router.delete('/leads/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }
    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete lead.' });
  }
});

// ---------------------------------------------
// ADMIN API: Update Website Content & Hero Settings
// ---------------------------------------------
router.post('/settings/content', requireAdmin, upload.single('hero_image_file'), (req, res) => {
  try {
    const fields = [
      'hero_badge_text',
      'hero_title_prefix',
      'hero_title_highlight',
      'hero_subtitle',
      'hero_image_url',
      'hero_cta_primary_text',
      'hero_cta_primary_link',
      'hero_cta_secondary_text',
      'hero_cta_secondary_link',
      'hero_rating_text',
      'float_badge_1_title',
      'float_badge_1_sub',
      'float_badge_2_title',
      'float_badge_2_sub',
      'float_badge_3_title',
      'float_badge_3_sub',
      'stat_1_num',
      'stat_1_label',
      'stat_2_num',
      'stat_2_label',
      'stat_3_num',
      'stat_3_label',
      'stat_4_num',
      'stat_4_label',
      'contact_email',
      'contact_phone',
      'contact_response_time',
      'footer_tagline'
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        db.setSetting(field, req.body[field].trim());
      }
    }

    if (req.file) {
      db.setSetting('hero_image_url', `/uploads/${req.file.filename}`);
    }

    res.json({
      success: true,
      message: 'Website content & hero settings updated successfully!',
      hero_image_url: req.file ? `/uploads/${req.file.filename}` : undefined
    });
  } catch (err) {
    console.error('Update content settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to update website content settings.' });
  }
});

// ---------------------------------------------
// ADMIN API: Password Update
// ---------------------------------------------
router.post('/settings/password', requireAdmin, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Both current and new passwords are required.' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(req.session.adminUser.username);
    if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, user.id);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
});

module.exports = router;
