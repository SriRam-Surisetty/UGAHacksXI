# StockSense

> AI-powered inventory intelligence for restaurants — built at UGAHacks XI (NCR Voyix Track: Inventory Health Monitor)

## Team

| Name | Role |
|------|------|
| SriRam Surisetty | Full-Stack Development, AI Integration |
| Divesh Gupta | Full-Stack Development, Database Architecture |
| Moulik Gupta | Full-Stack Development, Backend & API Design |
| Shruti Mishra | Full-Stack Development, UI/UX Design |

## Purpose

Inefficient inventory management leads to **millions of dollars in annual food waste** across the restaurant industry. Most small-to-medium business owners rely on spreadsheets or gut feeling — reactive restocking that causes stockouts (lost revenue) and overstock (waste).

**StockSense** is a predictive inventory management platform that shifts restaurants from reactive restocking to **proactive, AI-driven waste prevention**. It tracks inventory at the batch level, forecasts stockouts using 30-day consumption analytics, compares vendor pricing for procurement, and provides an AI chatbot that can query live inventory data in plain English.

### Key Features

- **Dashboard** — Composite inventory health score (0–100), KPI cards, expiring-soon alerts, and urgency-coded reorder suggestions
- **Master Inventory** — Ingredient type catalog and dish/recipe management with ingredient linking, CSV import/export
- **Stock Management** — Batch-level tracking with expiry dates, quantities, units, and a consume workflow that auto-decrements stock based on recipe ratios
- **Predictive Analytics** — Stockout prediction engine using weighted consumption history, 7-day stock forecasts, and automated reorder point calculation
- **Order & Procurement** — Multi-vendor price comparison (3–4 vendors per ingredient), quantity customization, order review, PO number generation, and CSV purchase order export for sending to suppliers
- **AI Chatbot** — Google Gemini 2.0 Flash with agentic SQL tool-calling — the AI autonomously queries the live database to answer natural language questions about inventory, consumption trends, and order history
- **Audit Trail** — Immutable log of every action (create, update, delete, login, import, export, consume, order) with filterable admin-only viewer
- **Multi-Tenancy** — Organization-level data isolation with role-based access control (admin/user)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native, Expo, Expo Router, TypeScript |
| Backend | Python, Flask, SQLAlchemy ORM |
| Database | MySQL (DigitalOcean Managed Database, SSL) |
| AI | Google Gemini 2.0 Flash (agentic tool-calling) |
| Auth | JWT (JSON Web Tokens), Werkzeug password hashing |
| Charts | react-native-svg |

## Tools Utilized

- **GitHub** — Version control and collaboration
- **VS Code** — Development environment
- **GitHub Copilot** — AI-assisted development
- **MySQL Workbench** — Database design and modeling
- **DigitalOcean** — Cloud-hosted managed MySQL database with SSL/TLS encryption
- **Postman** — API testing during development

## Public Frameworks & APIs Credited

- **[Flask](https://flask.palletsprojects.com/)** — Python micro web framework (BSD License)
- **[Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)** — JWT authentication middleware (MIT License)
- **[Flask-CORS](https://flask-cors.readthedocs.io/)** — Cross-Origin Resource Sharing support (MIT License)
- **[SQLAlchemy](https://www.sqlalchemy.org/)** — Python ORM (MIT License)
- **[React Native](https://reactnative.dev/)** — Cross-platform mobile/web framework (MIT License)
- **[Expo](https://expo.dev/)** — Managed React Native toolchain (MIT License)
- **[Expo Router](https://docs.expo.dev/router/introduction/)** — File-based navigation (MIT License)
- **[Google Generative AI SDK](https://ai.google.dev/)** — Gemini API client for agentic chatbot
- **[react-native-svg](https://github.com/software-mansion/react-native-svg)** — SVG rendering for charts and gauges (MIT License)
- **[Axios](https://axios-http.com/)** — HTTP client (MIT License)
- **[Ionicons](https://ionic.io/ionicons)** — Icon library (MIT License)

## Problems & Solutions

### 1. Stock Data Model Complexity
**Problem:** Tracking both ingredient *types* (catalog) and physical *stock batches* (with qty, expiry, batch numbers) in a single table was confusing and led to bugs where queries returned templates mixed with real inventory.

**Solution:** Adopted a `__STOCK__` dish pattern — stock batches are `Ingredient` rows with non-null `expiry`/`batchNum`, linked via a `DishIngredient` join to a hidden system dish named `__STOCK__`. This reuses the existing relational schema while cleanly separating catalog items from physical inventory.

### 2. Consumption-Based Forecasting with Sparse Data
**Problem:** Predicting stockouts requires consumption history, but new deployments have no data. Simple `stock / daily_usage` calculations produce divide-by-zero or infinity results.

**Solution:** Built a 30-day lookback window over audit logs (action=`CONSUME`), computing weighted daily usage rates. When no consumption data exists, ingredients default to "OK" status rather than false alarms. Added a mock data seeder that generates realistic 30-day consumption patterns for demos.

### 3. AI Chatbot Data Isolation
**Problem:** The Gemini chatbot has SQL execution capabilities — a prompt injection or poorly scoped query could leak data from other organizations.

**Solution:** Enforced multi-layered SQL validation: the system prompt hardcodes `orgID` filtering, the `validate_sql()` function rejects queries missing the org ID, blocked destructive DDL patterns (DROP, TRUNCATE, ALTER), and separated read vs write tool declarations so the AI must explicitly choose the write path.

### 4. Cross-Platform CSV Export
**Problem:** Generating and downloading CSV files works differently on web (Blob URLs + anchor click) vs native mobile (file system + share sheet). The purchase order export needed to work seamlessly on both.

**Solution:** Created a platform-adaptive export utility that uses `window.URL.createObjectURL()` on web and `expo-file-system` + `expo-sharing` on native, wrapped in a unified `exportPO()` function with graceful fallbacks.

