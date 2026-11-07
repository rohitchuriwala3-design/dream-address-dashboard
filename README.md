# Dream Address Studio — Executive ERP & Management Web App

Full-stack, dynamic, password-protected management application built for **Dream Address Studio** (Turnkey Interior Architecture & Contracting, Kolkata).

---

## 🌟 Features Included

1. **Password & Master PIN Security Gate**:
   - Master 4-digit PIN: `2026`
   - Master Admin Password: `dream2026`
   - Session authentication with remember-device token and logout.

2. **Executive Financial Health**:
   - Real-time KPIs: Total Turnover, Invoiced, Collected Advance, Direct Site Costs, Gross Margin %, Total Cash Holdings.
   - Interactive Chart.js charts: Site Cost Breakdown by Trade & Project Contract vs Incurred Cost.

3. **Sites Cockpit (Project Control Center)**:
   - Instant switching between all active projects (`PRJ-2026-001 Highline Highland`, `PRJ-2026-002 Ballygunge Park Villa`, etc.).
   - Live progress, client details, direct WhatsApp link, and stage-by-stage milestone billing status.
   - Direct expenditure progress bars matched with VLOOKUP formulas.

4. **Treasury & Cash Book**:
   - Real-time balances for HDFC Bank (Current A/C), Cash Box - Workshop (Tangra), Cash Box - Site 01 (Highline).
   - Live transaction ledger with instant expense recording and balance updates.

5. **AI Physical Ledger Scanner (Gemini Vision)**:
   - Upload site receipts or snap photos directly on mobile.
   - Vision AI extracts Vendor, Bill No, Trade, Amount, and line items for Google Sheets approval.

6. **Vendor & Contractor Directory**:
   - Kolkata suppliers categorized by trade with 1-click WhatsApp and Phone call actions.

---

## 🚀 How to Deploy on Render (100% Free)

1. **Create a GitHub Repository**:
   - Push this `dream-address-web` folder to a new GitHub repository (e.g. `dream-address-portal`).
2. **Open Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and log in.
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.
3. **Configure Settings**:
   - **Name**: `dream-address-dashboard`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
4. **Environment Variables**:
   - `ADMIN_PIN`: `2026`
   - `APP_PASSWORD`: `dream2026`
   - `GOOGLE_SHEET_ID`: `1oJP7fqIGl48cUPq76XOogPQ-B5IfHHESt0JCTVpIW5o`
5. Click **Create Web Service**. Within 2 minutes, your live URL will be active (e.g., `https://dream-address-dashboard.onrender.com`).

---

## 💻 Local Testing

```bash
cd dream-address-web
npm install
npm start
```
Then open `http://localhost:3000` in your browser.
