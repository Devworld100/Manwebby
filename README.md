# MAN Commercial Protection — Web Portal & Website

Official web presence and authenticated vault custody portal for **MAN Commercial Protection Ltd** (Solihull, UK).

---

## Features

- **Public Corporate Website**:
  - Full company presentation: Services, Sectors, Clients, Careers, News, and Training Academy.
  - Video-enabled responsive header carousel featuring `assets/videos/mcp-services-clip-.mp4` and `assets/videos/mcp-training-2.mp4` with automatic transitions.
  - Dynamic interactive megamenus, accreditation badges, and case study highlights.

- **Vault Custody & Beneficiary Portal (`login.html`)**:
  - **Protected Beneficiary Dashboard**: Real-time asset tracking, 5-stage claim lifecycle progress stepper, and live daily demurrage accrual calculations ($10.00/day).
  - **Official Certificate of Deposit**: Authentic printable legal document featuring Red Manager Signature (*Iain McCallister - General Manager & CEO*), Blue Depositor Signature (*matching active account claimant*), Official 1993 Vault Seal, and demurrage clauses.
  - **Admin Management Console**: Full CRUD operations for claimant accounts and dynamic legal reassignment tool with immutable audit justifications.
  - **Mandated 2-Day Collection Notice**: Claim scheduling interface adhering to custodial terms.

- **Embedded Backend & Database**:
  - **Zero-Dependency SQLite**: Powered by Node.js built-in `node:sqlite` in WAL mode (`data/portal.db`).
  - **REST API Endpoints**: Authentication (`/api/auth/login`), profile CRUD (`/api/profiles`), dynamic reassignments (`/api/profiles/:id/reassign`), and collection notices (`/api/collection-notice`).
  - **Streaming Support**: Built-in HTTP 206 byte-range audio/video streaming for `.mp4` media.

---

## Project Structure

```
man-portal/
├── assets/                  # Static media assets
│   ├── images/              # Logos, accreditations, badges
│   └── videos/              # Video carousel clips
├── docs/                    # Technical & portal documentation
│   ├── MAN-Portal-Documentation.html
│   └── screenshots/         # System screenshots for documentation
├── css/                     # Stylesheets (corporate site & portal)
├── js/                      # Frontend JavaScript modules
├── data/                    # SQLite database storage (WAL mode)
├── *.html                   # Corporate web pages & vault portal
├── serve.js                 # Embedded HTTP/REST API web server
├── db.js                    # Database operations & seeding
├── push.bat                 # One-click GitHub sync launcher
├── share.bat                # One-click Cloudflare tunnel live share
└── package.json             # NPM package configuration
```

---

## Quick Start

### Prerequisites
- Node.js v22+ (recommended Node.js v24+)

### Running Locally
```bash
# Clone the repository
git clone https://github.com/Devworld100/Manwebby.git
cd Manwebby

# Start the web server
npm start
```
The site will be live at **http://localhost:3000/**.

### Online Deployment & Sharing
- **Cloudflare Tunnel / Instant Live Sharing**:
  ```bash
  npm run share
  ```
  Launches the server and provisions an encrypted `https://*.trycloudflare.com` public URL.
- **Cloud Deployment**: Ready to deploy on any Node.js host (Render, Railway, VPS, Docker, Heroku, AWS).

---

## License & Compliance
&copy; 2026 MAN Commercial Protection Ltd. All Rights Reserved.  
Registered in England & Wales (No. 04639310). SIA Approved Contractor & ISO 9001:2015 Accredited.
