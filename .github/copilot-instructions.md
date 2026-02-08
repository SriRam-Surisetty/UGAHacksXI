# Copilot Instructions

## Project Overview
- This repo is a two-part system: a Flask API in `back-end/` and an Expo Router app in `front-end/`.
- Front-end navigation is file-based via `front-end/app/` (see `app/_layout.tsx` and `app/(tabs)/_layout.tsx`).
- The API serves auth, users, inventory, and Gemini chat endpoints from a single Flask app (`back-end/app.py`).

## Key Architecture & Data Flow
- Auth is JWT-based: `/login` returns `access_token` and `userID`; `/users/me` reads the JWT (`back-end/app.py`).
- The React Native app uses a shared Axios client with a JWT interceptor in `front-end/services/api.ts`.
- Tokens and user profile data are persisted via SecureStore on native and localStorage on web (`front-end/services/storage.ts`).
- Inventory data flows from `/inventory/*` endpoints into the Inventory screen (`front-end/app/Inventory.tsx`).
- Chat uses a Gemini-backed `/chat` endpoint (requires `GEMINI_API_KEY`) in `back-end/app.py`.

## External Services & Environment
- MySQL is hosted on DigitalOcean with SSL; the API expects `back-end/certs/ca-certificate.crt` (see `SQLALCHEMY_DATABASE_URI` in `back-end/app.py`).
- CORS is restricted to `http://localhost:8081` in `back-end/app.py`.
- Both chat interfaces (`ChatWidget.tsx` and `(tabs)/chatbot.tsx`) now use the shared `api` client from `front-end/services/api.ts`.
- Android emulator base URL is `http://10.0.2.2:5001`, while web/iOS use `http://localhost:5001` (`front-end/services/api.ts`).

## Developer Workflows
- Front-end: from `front-end/`, run `npm install` then `npm run start`.
- Back-end: from `back-end/`, run `pip install -r requirements.txt` then `python app.py`.

## Project Conventions & Patterns
- Screens are routed by filename in `front-end/app/`; avoid adding manual navigation stacks when file routing is sufficient.
- Use the shared `api` client for authenticated API calls; it attaches JWT headers and clears invalid tokens (`front-end/services/api.ts`).
- Inventory CRUD in the UI expects backend IDs named `dishID`/`ingID` and maps to local `id` (`front-end/app/Inventory.tsx`).
- The UI theme palette lives in `front-end/constants/theme.ts` and is referenced directly in styles.

## Integration Points
- Backend models map to tables: `orgs`, `users`, `dishes`, `ing`, `dish_ing`, and `audit_logs` (`back-end/app.py`).
- Inventory endpoints include:
  - `GET /inventory/dishes`
  - `GET /inventory/ingredients`
  - `GET /inventory/dishes/<id>`
  - `POST /inventory/ingredient-types`
- Vendor pricing / order endpoints:
  - `GET /vendors/pricing` — simulated multi-vendor price comparisons per ingredient, with 7-day stock forecast.
  - `POST /vendors/order` — place a simulated order (recorded in audit logs as `ORDER` action).
- The Order page (`front-end/app/Order.tsx`) shows priority levels (P0–P3), vendor comparison cards, 7-day sparkline forecasts, and a sticky order bar.
- Dashboard reorder suggestions link to the Order page via `?ingredient=<name>&urgency=<level>`.
- The Gemini chatbot endpoint is `POST /chat` with `{ "message": "..." }`.
- Audit logging: every mutating action (create, update, delete, login, import, export, consume, chat, order) is recorded in the `audit_logs` table via `record_audit()`.
  - `GET /audit-logs` returns paginated audit logs (admin only). Supports `?action=`, `?resource_type=`, `?page=`, `?per_page=` query params.
  - The Audit Logs UI is at `front-end/app/AuditLogs.tsx` (admin only, linked from the nav header).
