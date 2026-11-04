require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');

const isServerless = !!(
  process.env.NETLIFY ||
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

const dbDir = isServerless
  ? path.join(os.tmpdir(), 'beavers-bridge-data')
  : path.join(__dirname, 'data');

if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (e) {
    console.warn('[DB] Could not create database directory:', e.message);
  }
}

// In-memory fallback adapter for serverless environments where native binary is unavailable
function createMemoryDbAdapter() {
  const store = {
    admin_users: [],
    services: [],
    projects: [],
    testimonials: [],
    leads: [],
    site_settings: {}
  };

  return {
    exec() {},
    pragma() {},
    prepare(sql) {
      const s = sql.trim().toLowerCase();
      return {
        run(...args) {
          if (s.includes('into admin_users')) {
            store.admin_users.push({ id: store.admin_users.length + 1, username: args[0], password_hash: args[1], created_at: new Date().toISOString() });
            return { lastInsertRowid: store.admin_users.length };
          }
          if (s.includes('into services')) {
            store.services.push({ id: store.services.length + 1, title: args[0], slug: args[1], tagline: args[2], icon: args[3], description: args[4], deliverables: args[5], best_for: args[6], sort_order: args[7] || 0 });
            return { lastInsertRowid: store.services.length };
          }
          if (s.includes('into testimonials')) {
            store.testimonials.push({ id: store.testimonials.length + 1, client_name: args[0], client_role: args[1], client_company: args[2], avatar_url: args[3], quote: args[4], highlight_metric: args[5], rating: args[6] || 5, featured: args[7] !== undefined ? args[7] : 1, sort_order: args[8] || 0, created_at: new Date().toISOString() });
            return { lastInsertRowid: store.testimonials.length };
          }
          if (s.includes('into projects')) {
            store.projects.push({ id: store.projects.length + 1, title: args[0], client: args[1], category: args[2], summary: args[3], challenge: args[4], solution: args[5], metrics: args[6], image_url: args[7], live_url: args[8], featured: args[9] !== undefined ? args[9] : 1, sort_order: args[10] || 0, created_at: new Date().toISOString() });
            return { lastInsertRowid: store.projects.length };
          }
          if (s.includes('into leads')) {
            store.leads.push({ id: store.leads.length + 1, name: args[0], email: args[1], phone: args[2], company: args[3] || '', website: args[4] || '', service_needed: args[5] || '', monthly_budget: args[6] || '', message: args[7] || '', status: 'New', created_at: new Date().toISOString() });
            return { lastInsertRowid: store.leads.length };
          }
          if (s.includes('into site_settings')) {
            store.site_settings[args[0]] = String(args[1]);
            return { lastInsertRowid: 1 };
          }
          if (s.includes('update site_settings')) {
            store.site_settings[args[1]] = String(args[0]);
            return { changes: 1 };
          }
          if (s.includes('update admin_users')) {
            const user = store.admin_users.find(u => u.id === args[1]);
            if (user) user.password_hash = args[0];
            return { changes: 1 };
          }
          if (s.includes('update leads')) {
            const lead = store.leads.find(l => l.id === Number(args[1]));
            if (lead) lead.status = args[0];
            return { changes: 1 };
          }
          if (s.includes('delete from leads')) {
            const idx = store.leads.findIndex(l => l.id === Number(args[0]));
            if (idx !== -1) store.leads.splice(idx, 1);
            return { changes: 1 };
          }
          if (s.includes('delete from projects')) {
            const idx = store.projects.findIndex(p => p.id === Number(args[0]));
            if (idx !== -1) store.projects.splice(idx, 1);
            return { changes: 1 };
          }
          if (s.includes('delete from testimonials')) {
            const idx = store.testimonials.findIndex(t => t.id === Number(args[0]));
            if (idx !== -1) store.testimonials.splice(idx, 1);
            return { changes: 1 };
          }
          return { changes: 1, lastInsertRowid: 1 };
        },
        get(...args) {
          if (s.includes('count(*) as count from admin_users')) {
            return { count: store.admin_users.length };
          }
          if (s.includes('count(*) as count from services')) {
            return { count: store.services.length };
          }
          if (s.includes('count(*) as count from testimonials')) {
            return { count: store.testimonials.length };
          }
          if (s.includes('count(*) as count from projects')) {
            return { count: store.projects.length };
          }
          if (s.includes('count(*) as count from leads')) {
            if (s.includes('status = ?')) {
              return { count: store.leads.filter(l => l.status === args[0]).length };
            }
            return { count: store.leads.length };
          }
          if (s.includes('from admin_users where username = ?')) {
            return store.admin_users.find(u => u.username === args[0]);
          }
          if (s.includes('from projects where id = ?')) {
            return store.projects.find(p => p.id === Number(args[0]));
          }
          if (s.includes('from testimonials where id = ?')) {
            return store.testimonials.find(t => t.id === Number(args[0]));
          }
          if (s.includes('from site_settings where key = ?')) {
            return store.site_settings[args[0]] ? { value: store.site_settings[args[0]] } : undefined;
          }
          return undefined;
        },
        all(...args) {
          if (s.includes('from services')) {
            return [...store.services].sort((a, b) => a.sort_order - b.sort_order);
          }
          if (s.includes('from projects')) {
            let list = [...store.projects];
            if (s.includes('featured = 1')) list = list.filter(p => p.featured === 1);
            list.sort((a, b) => a.sort_order - b.sort_order || b.id - a.id);
            if (s.includes('limit 6')) list = list.slice(0, 6);
            if (s.includes('limit 4')) list = list.slice(0, 4);
            return list;
          }
          if (s.includes('from testimonials')) {
            let list = [...store.testimonials];
            if (s.includes('featured = 1')) list = list.filter(t => t.featured === 1);
            list.sort((a, b) => a.sort_order - b.sort_order || b.id - a.id);
            return list;
          }
          if (s.includes('from leads')) {
            let list = [...store.leads];
            if (s.includes('where status = ?')) list = list.filter(l => l.status === args[0]);
            list.sort((a, b) => b.id - a.id);
            if (s.includes('limit 6')) list = list.slice(0, 6);
            return list;
          }
          if (s.includes('from site_settings')) {
            return Object.entries(store.site_settings).map(([key, value]) => ({ key, value }));
          }
          return [];
        }
      };
    }
  };
}

let db = null;
try {
  const Database = require('better-sqlite3');
  const dbPath = path.join(dbDir, 'beaversbridge.db');
  db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
  } catch (e) {
    // WAL mode may not be supported on some serverless tmp filesystems
  }
} catch (err) {
  console.warn('[DB] better-sqlite3 failed or unavailable, fallback to memory adapter:', err.message);
  db = createMemoryDbAdapter();
}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    client TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    challenge TEXT,
    solution TEXT,
    metrics TEXT NOT NULL,
    image_url TEXT NOT NULL,
    live_url TEXT,
    featured INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    client_role TEXT NOT NULL,
    client_company TEXT NOT NULL,
    avatar_url TEXT,
    quote TEXT NOT NULL,
    highlight_metric TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    featured INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    deliverables TEXT NOT NULL, -- JSON array
    best_for TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    website TEXT,
    service_needed TEXT,
    monthly_budget TEXT,
    message TEXT,
    status TEXT DEFAULT 'New', -- 'New', 'Contacted', 'Qualified', 'Closed', 'Archived'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed default admin if missing
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
if (adminCount === 0) {
  const initialAdminUser = process.env.ADMIN_USERNAME || 'admin';
  const initialAdminPass = process.env.ADMIN_PASSWORD;

  if (initialAdminPass) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(initialAdminPass, salt);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(initialAdminUser, hash);
    console.log(`[DB] Created initial administrator account from environment: ${initialAdminUser}`);
  } else {
    // Generate a secure one-time initial setup password
    const tempPassword = crypto.randomBytes(6).toString('hex') + '!Bb';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(tempPassword, salt);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(initialAdminUser, hash);
    console.log('\n=======================================================');
    console.log(`[DB] Initial administrator account created: ${initialAdminUser}`);
    console.log(`[DB] Temporary initial setup password: ${tempPassword}`);
    console.log('[DB] Set ADMIN_PASSWORD in your .env file or update password in /admin/settings');
    console.log('=======================================================\n');
  }
}

// Seed services if missing
const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
if (serviceCount === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (title, slug, tagline, icon, description, deliverables, best_for, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultServices = [
    {
      title: 'Strategic Group & Community Access',
      slug: 'community-selection',
      tagline: 'Enter the digital town squares where your ideal clients ask for recommendations daily.',
      icon: 'users',
      description: 'We research, evaluate, and embed your business into the most active, high-intent local Facebook groups and community hubs where trust is earned and referrals thrive organically.',
      deliverables: JSON.stringify([
        'Deep-dive audit of high-density local Facebook groups',
        'Vetted target group whitelist tailored to your exact territory',
        'Moderator relationship mapping and group guidelines compliance',
        'Neighborhood demographic resonance analysis'
      ]),
      best_for: 'Home service contractors, remodelers, roofers, and local businesses seeking hyper-local authority.',
      sort_order: 1
    },
    {
      title: 'Expert Authority Copywriting & Content',
      slug: 'authority-copywriting',
      tagline: 'Native, story-driven posts that showcase your craftsmanship without feeling like an ad.',
      icon: 'feather',
      description: 'Our elite copywriters craft value-packed, authentic narrative posts that capture attention, demonstrate undeniable craftsmanship, and trigger meaningful comment engagement from motivated homeowners.',
      deliverables: JSON.stringify([
        'Custom brand voice playbook reflecting your values & craft',
        'High-converting, non-salesy project showcases & educational hooks',
        'Native visual storytelling & before-and-after case study styling',
        'Comment magnets designed to spark natural community dialogue'
      ]),
      best_for: 'Brands tired of looking like spammy advertisers who want genuine prestige.',
      sort_order: 2
    },
    {
      title: 'Active Community Engagement & Nurturing',
      slug: 'community-engagement',
      tagline: 'Authentic conversations that turn curious neighbors into enthusiastic brand advocates.',
      icon: 'message-circle',
      description: 'We don’t just drop posts and vanish. We actively nurture community interactions, answer homeowner inquiries in real time, build goodwill, and steer community discussions toward your expertise.',
      deliverables: JSON.stringify([
        'Daily community monitoring and response handling',
        'Authentic peer-to-peer conversation nurturing',
        'Soft brand mentions in relevant homeowner recommendation threads',
        'Spam-free reputation guarding and positive sentiment building'
      ]),
      best_for: 'Busy founders who don’t have 3 hours a day to sit on Facebook groups building rapport.',
      sort_order: 3
    },
    {
      title: 'Organic Lead Harvesting & Pipeline Architecture',
      slug: 'organic-lead-generation',
      tagline: 'Converting community trust into high-intent inbound inquiries and booked estimates.',
      icon: 'target',
      description: 'We build the bridge between group discussions and your sales calendar. Motivated homeowners transition naturally into private direct messages and strategy calls with zero high-pressure sales friction.',
      deliverables: JSON.stringify([
        'DM conversation routing and appointment booking frameworks',
        'Pre-qualification questioning to filter out tire-kickers',
        'Seamless CRM or calendar integration (Calendly, HubSpot, etc.)',
        'Zero ad spend, predictable weekly pipeline of high-ticket homeowners'
      ]),
      best_for: 'Companies wanting qualified leads with 5x higher purchase intent than cold display ads.',
      sort_order: 4
    },
    {
      title: 'Continuous Optimization & Sentiment Intelligence',
      slug: 'optimization-tracking',
      tagline: 'Data-driven refinement measuring impressions, engagement velocity, and pipeline revenue.',
      icon: 'bar-chart-3',
      description: 'Transparent weekly dashboards detailing organic impressions, comment response velocity, qualified lead counts, and revenue attribution so you always know your exact return on investment.',
      deliverables: JSON.stringify([
        'Weekly transparent lead and conversion analytics report',
        'Content angle testing and seasonal hook adaptation',
        'Community response sentiment analysis and keyword tracking',
        'Ongoing territory expansion into adjacent neighborhoods'
      ]),
      best_for: 'Data-conscious business owners who demand clear ROI and transparency.',
      sort_order: 5
    },
    {
      title: 'Multi-Channel Repurposing & Scale',
      slug: 'multi-channel-scale',
      tagline: 'Multiplying winning community stories across Google, LinkedIn, and Email newsletters.',
      icon: 'share-2',
      description: 'Once an organic narrative strikes gold in local groups, we repurpose the winning angles into Google Business profile updates, local SEO snippets, case studies, and email newsletters for maximum leverage.',
      deliverables: JSON.stringify([
        'Google Business Profile community post repurposing',
        'Hyper-local SEO case study writeups for your website',
        'Social proof graphics for your sales team & presentation deck',
        'Email newsletter features highlighting recent local client transformations'
      ]),
      best_for: 'Established businesses ready to dominate their entire regional digital footprint.',
      sort_order: 6
    }
  ];

  for (const s of defaultServices) {
    insertService.run(s.title, s.slug, s.tagline, s.icon, s.description, s.deliverables, s.best_for, s.sort_order);
  }
  console.log('[DB] Seeded default services.');
}

// Seed testimonials if missing
const testimonialCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get().count;
if (testimonialCount === 0) {
  const insertTestimonial = db.prepare(`
    INSERT INTO testimonials (client_name, client_role, client_company, avatar_url, quote, highlight_metric, rating, featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultTestimonials = [
    {
      client_name: 'Justin Nadeau',
      client_role: 'Founder & Owner',
      client_company: 'Second Chance Home Improvements',
      avatar_url: '/images/avatars/justin.jpg',
      quote: "163 qualified leads in six months, resulting in hundreds of thousands in new revenue. The organic community approach of Beaver's Bridge genuinely works where paid Facebook ads completely failed us.",
      highlight_metric: '163 Leads In 6 Months • $420,000+ Revenue',
      rating: 5,
      featured: 1,
      sort_order: 1
    },
    {
      client_name: 'John Bradley',
      client_role: 'Regional Operations Director',
      client_company: 'Hello Garage of Rochester & Syracuse',
      avatar_url: '/images/avatars/john.jpg',
      quote: "82 qualified leads with an incredible 60% booking rate. Our customer acquisition cost dropped to just $240 – completely unheard of in the garage coating and renovation industry. They built real local trust for our brand.",
      highlight_metric: '60% Booking Rate • $240 CAC',
      rating: 5,
      featured: 1,
      sort_order: 2
    },
    {
      client_name: 'Greg Van Horn',
      client_role: 'Managing Partner',
      client_company: 'Bumble Roofing',
      avatar_url: '/images/avatars/greg.jpg',
      quote: "Beaver's Bridge generated 123 high-ticket leads and $300,000 in additional roof replacement revenue for our Philadelphia territory in 2024 alone. Homeowners were calling us already trusting our team.",
      highlight_metric: '123 Leads • $300,000 In Revenue',
      rating: 5,
      featured: 1,
      sort_order: 3
    },
    {
      client_name: 'Sarah Lindqvist',
      client_role: 'Lead Designer & Principal',
      client_company: 'Artisan Custom Closets',
      avatar_url: '/images/avatars/sarah.jpg',
      quote: "Before Beaver's Bridge, we spent thousands on pay-per-click clicks that never converted. Their storytelling in local parent and homeowners groups made us the number-one recommended closet builder in our county within 90 days.",
      highlight_metric: '94 Leads • 4.8x ROI',
      rating: 5,
      featured: 1,
      sort_order: 4
    }
  ];

  for (const t of defaultTestimonials) {
    insertTestimonial.run(t.client_name, t.client_role, t.client_company, t.avatar_url, t.quote, t.highlight_metric, t.rating, t.featured, t.sort_order);
  }
  console.log('[DB] Seeded default testimonials.');
}

// Seed projects if missing
const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
if (projectCount === 0) {
  const insertProject = db.prepare(`
    INSERT INTO projects (title, client, category, summary, challenge, solution, metrics, image_url, live_url, featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultProjects = [
    {
      title: 'Second Chance Home Remodeling: Hyper-Local Community Domination',
      client: 'Second Chance Home Improvements',
      category: 'Home Remodeling',
      summary: 'Generated 163 high-intent kitchen and bathroom remodeling leads organically across 18 regional community groups.',
      challenge: 'The client was spending $4,500/month on Google Local Service Ads and Yelp with diminishing returns, low-quality price shoppers, and high cancellation rates.',
      solution: 'Beaver’s Bridge identified 18 high-income suburban Facebook groups, curated before-and-after renovation stories focusing on craftsmanship problem-solving, and fostered organic homeowner discussions without sales pitches.',
      metrics: '163 Leads | $420,000 Generated | 4.8x Pipeline ROI',
      image_url: '/images/projects/remodel.jpg',
      live_url: 'https://secondchancehomeimprovements.com',
      featured: 1,
      sort_order: 1
    },
    {
      title: 'Hello Garage: Floor Coating Rapid Regional Scale',
      client: 'Hello Garage of Rochester & Syracuse',
      category: 'Garage & Coatings',
      summary: 'Achieved an unprecedented 60% booking rate and slashed customer acquisition cost to $240 via authentic neighborhood showcases.',
      challenge: 'Concrete epoxy coating is considered a luxury purchase with skeptical homeowners worried about peeling and warranty disputes.',
      solution: 'We orchestrated visual time-lapse storytelling and neighborhood garage transformations in local homeowner associations, addressing durability head-on and sparking peer referrals.',
      metrics: '82 Qualified Leads | 60% Booking Rate | $240 CAC',
      image_url: '/images/projects/garage.jpg',
      live_url: 'https://hellogarage.com',
      featured: 1,
      sort_order: 2
    },
    {
      title: 'Bumble Roofing: Trust-Driven Storm & Replacement Pipeline',
      client: 'Bumble Roofing Philadelphia',
      category: 'Roofing & Exteriors',
      summary: 'Unlocked $300,000 in verified roofing contracts in under six months by educating homeowners on storm inspection rights.',
      challenge: 'Roofing is plagued by aggressive door-to-door canvassers and shady storm chasers, leading to widespread consumer distrust.',
      solution: 'Established the client as the neutral, consumer-advocate roofing inspector in local groups, publishing unbiased roof health guides and answering homeowner storm damage questions transparently.',
      metrics: '123 Leads | $300,000 Added Revenue | 0$ Ad Spend',
      image_url: '/images/projects/roofing.jpg',
      live_url: 'https://bumbleroofing.com',
      featured: 1,
      sort_order: 3
    },
    {
      title: 'Artisan Custom Closets: Luxury Storage Elevation',
      client: 'Artisan Custom Closets',
      category: 'Home Organization',
      summary: 'Positioned boutique custom closet craftsmanship in affluent neighborhood groups, yielding 94 high-ticket consults.',
      challenge: 'Struggling to differentiate from big-box franchise modular closet companies offering steep discounts.',
      solution: 'Focused copy on architectural custom joinery, pantry optimization for busy families, and walk-in wardrobe transformations shared directly by satisfied local moms and interior designers.',
      metrics: '94 Consultations | $210,000 Pipeline | 72% Close Rate',
      image_url: '/images/projects/closets.jpg',
      live_url: '',
      featured: 1,
      sort_order: 4
    },
    {
      title: 'EverGreen Climate: Residential Heat Pump & HVAC Revolution',
      client: 'EverGreen Climate Solutions',
      category: 'HVAC & Plumbing',
      summary: 'Captured 140 replacement estimates through seasonal energy rebate education and community winterization advice.',
      challenge: 'Severe seasonality and high competition from legacy multi-million-dollar HVAC franchises with massive TV budgets.',
      solution: 'Engineered an educational campaign on federal heat pump tax credits and real utility bill comparisons, making EverGreen the trusted green energy contractor in regional towns.',
      metrics: '140 Leads | $380,000 Booked Jobs | 3.2x Lead Volume',
      image_url: '/images/projects/hvac.jpg',
      live_url: '',
      featured: 1,
      sort_order: 5
    },
    {
      title: 'Apex Clean Energy: Neighborhood Solar Micro-Referral Networks',
      client: 'Apex Clean Energy',
      category: 'Renewables',
      summary: 'Created hyper-local cluster referrals where entire streets signed up for solar installations together.',
      challenge: 'Consumers were fatigued by aggressive cold callers and misleading "free solar" online ads.',
      solution: 'We partnered with pioneering green homeowners in suburban subdivisions to document their real electric bill reductions with transparent meter photos, driving adjacent neighbor adoption.',
      metrics: '76 Contracts | $510,000 Revenue | 92% Referral Trust',
      image_url: '/images/projects/solar.jpg',
      live_url: '',
      featured: 1,
      sort_order: 6
    }
  ];

  for (const p of defaultProjects) {
    insertProject.run(p.title, p.client, p.category, p.summary, p.challenge, p.solution, p.metrics, p.image_url, p.live_url, p.featured, p.sort_order);
  }
  console.log('[DB] Seeded default projects.');
}

// Default site settings
const defaultSettings = {
  // Hero Section
  hero_badge_text: '200+ Businesses Scaled & $12M+ Organic Revenue',
  hero_title_prefix: 'Turn Community Trust into Your',
  hero_title_highlight: 'Greatest Growth Engine',
  hero_subtitle: "Unlock a predictable stream of qualified, high-ticket organic leads and build an undeniable local authority without spending a dime on ads. Inspired by nature's master engineer, we bridge your craftsmanship directly with motivated local homeowners.",
  hero_image_url: '/images/logo.png',
  hero_cta_primary_text: 'Get Your Free Strategy Session',
  hero_cta_primary_link: '/contact',
  hero_cta_secondary_text: 'Explore Proven Work',
  hero_cta_secondary_link: '/projects',
  hero_rating_text: 'Rated 4.9/5 by 200+ Home Service Contractors',

  // Floating Badges on Hero Image
  float_badge_1_title: '+163 Qualified Leads',
  float_badge_1_sub: '$420,000+ In Pipeline',
  float_badge_2_title: '60% Booking Rate',
  float_badge_2_sub: '$240 Avg Customer Acq',
  float_badge_3_title: '100% Organic Trust',
  float_badge_3_sub: '$0 In Ad Spend',

  // Trust Ticker Stats
  stat_1_num: '30,000+',
  stat_1_label: 'Monthly Organic Impressions',
  stat_2_num: '4.5+',
  stat_2_label: 'Weekly Qualified Inbound Leads',
  stat_3_num: '$240',
  stat_3_label: 'Average Customer Acquisition Cost',
  stat_4_num: '$12.4M+',
  stat_4_label: 'Verified Client Revenue Generated',

  // Contact & Company Info
  contact_email: 'beaversbridge@gmail.com',
  contact_phone: '+1 (347) 766-4135',
  contact_response_time: 'Average Response Time: Under 4 Hours (Mon to Fri)',
  footer_tagline: 'Connecting local roofers, remodelers, and tradesmen directly with homeowners who need work done. One contractor per town.'
};

// Seed default settings into database if not present
const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)
`);
for (const [k, v] of Object.entries(defaultSettings)) {
  insertSetting.run(k, String(v));
}

db.getAllSettings = function () {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = { ...defaultSettings };
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
};

db.setSetting = function (key, value) {
  db.prepare(`
    INSERT INTO site_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, String(value));
};

module.exports = db;
