# 🌲 Beaver's Bridge — Premium Organic Community Growth & Portfolio Platform

An elite, high-converting full-stack Node.js website and portfolio platform for **Beaver's Bridge**, engineered to mirror and elevate the conversion architecture of [ridethewave.info](https://ridethewave.info/).

Built with the official brand identity, custom logo crest, Instrument Serif typography, rich dark-forest glassmorphism, dynamic project showcase, verified client testimonials, lead capture engine, and a complete administrative backend panel.

---

## 🌟 Key Features

### 🎨 Visual Identity & Frontend UI
- **Official Brand Crest**: Incorporates the custom circular woodcrafted Beaver's Bridge emblem and color palette (Deep Forest Green `#081b13`, Emerald `#22c55e`, Master Wood Amber `#c07a3e`, and Gold `#e5b85a`).
- **Signature Typography**: Editorial **Instrument Serif** (normal & italic) paired with geometric **Plus Jakarta Sans**, matching the visual prestige of `ridethewave.info`.
- **Responsive Architecture**: Pixel-perfect layout with mobile-drawer navigation, dynamic category pills, blurred sticky navbar, and glassmorphic cards.
- **Interactive Modals**: Seamless case study deep-dives detailing the *Client Challenge*, *Beaver's Bridge Strategy*, and *Verifiable Metrics*.

### 🚀 Public Pages & Core Sections
1. **Homepage (`/`)**:
   - High-impact Hero with Instrument Serif italic emphasis and social proof badge (*200+ Businesses Scaled • $12.4M+ Revenue Generated*).
   - Trust and performance statistics ticker bar (30,000+ Monthly Impressions, 4.5+ Weekly Leads, $240 CAC).
   - "Beyond Traditional Marketing" comparative value matrix (Ad Treadmill vs Beaver's Bridge Organic Domination).
   - Full 6-Pillar Core Services breakdown with deliverables list.
   - Filterable Projects & Proven Case Studies gallery.
   - Verified Client Testimonials and 5-star review carousel.
   - 4-Step Organic Acquisition Process breakdown.
   - Interactive FAQ Accordion.
   - Embedded Strategy Session Booking Form with instant AJAX submission and toast notification.
2. **About Us (`/about`)**:
   - The Beaver's Bridge genesis story: why nature's master engineer embodies enduring digital architecture.
   - Four core craft values and team philosophy.
3. **Services (`/services`)**:
   - Deep dive into all 6 core services (Community Group Access, Authority Copywriting, Peer Nurturing, Inbound Lead Harvesting, Sentiment Intelligence, and Multi-Channel Scale) with deliverable checklists.
4. **Projects & Case Studies (`/projects`)**:
   - Filterable portfolio gallery by trade and industry (Home Remodeling, Garage & Coatings, Roofing & Exteriors, Home Organization, HVAC, Renewables).
   - Full modal viewer with metrics.
5. **Contact & Booking (`/contact`)**:
   - Discovery session application form, direct contact channels, territory exclusivity info, and FAQ.

### 🛡️ Administrative Backend Panel (`/admin`)
- **Protected by Session Authentication**: Secure bcrypt password hashing.
- **Dashboard Overview**: Live KPI metric cards for Total Projects, Testimonials, Inbound Leads, and New Inquiries.
- **Project Manager (`/admin/projects`)**: Add new case studies with file upload or image URL, edit existing entries, toggle homepage featured status, and delete.
- **Testimonial Manager (`/admin/testimonials`)**: Add and manage client reviews, star ratings, and metric callouts.
- **Inbound Leads CRM (`/admin/leads`)**: Review inquiries submitted from the website, filter by status (*New, Contacted, Qualified, Closed, Archived*), update status in real time, or remove leads.
- **Account & Security Settings (`/admin/settings`)**: Update admin password and monitor runtime system diagnostics.

---

## ⚙️ Environment Variables & Security Configuration

Create a `.env` file in the project root by copying the provided template:

```bash
cp .env.example .env
```

Configure your environment settings:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Local application port | `3000` |
| `SESSION_SECRET` | Cryptographic secret for signing session cookies | Secure random 32+ character string |
| `ADMIN_USERNAME` | Initial administrator username | `admin` |
| `ADMIN_PASSWORD` | Initial password used when creating initial admin | Configured by user |

> **Security Note**: Never commit your `.env` file to version control. Passwords can also be changed at any time directly through the **/admin/settings** security panel.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **View Engine**: EJS with reusable partials
- **Database**: SQLite3 via `better-sqlite3` (WAL mode enabled for lightning speed)
- **Authentication**: `express-session` & `bcryptjs`
- **File Uploads**: `multer` with storage in `/public/uploads/`
- **Icons**: Lucide Icons
- **Typography**: Google Fonts (*Instrument Serif* & *Plus Jakarta Sans*)

---

## 🚀 Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or with automatic restart during development:
```bash
npm run dev
```

### 3. Open in Browser
- **Live Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
