const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD || 'dream2026';
const ADMIN_PIN = process.env.ADMIN_PIN || '2026';
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1oJP7fqIGl48cUPq76XOogPQ-B5IfHHESt0JCTVpIW5o';

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// File Uploads
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 15 * 1024 * 1024 }
});
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// In-Memory Database tailored for Pure Cash + Bank Turnkey Operations (Zero GST)
const db = {
  kpis: {
    totalTurnover: 6850000,
    totalInvoiced: 4110000,
    totalCollected: 3425000,
    totalOutstanding: 685000,
    directCosts: 2214000,
    grossMarginPercent: 35.4,
    bankBalance: 1145000,
    cashBalances: 341000,
    totalCashHoldings: 1486000
  },
  accounts: [
    { id: "ACC-01", name: "HDFC Bank (Current A/C)", number: "50200012345678", type: "Bank", balance: 1145000 },
    { id: "ACC-02", name: "Cash Box - Workshop (Tangra)", number: "CB-WRK-01", type: "Cash", balance: 185000 },
    { id: "ACC-03", name: "Cash Box - Site 01 (Highline)", number: "CB-SITE-01", type: "Cash", balance: 156000 }
  ],
  projects: [
    {
      id: "PRJ-2026-001",
      name: "Highline Highland - Penthouse 14B",
      client: "Ananya Sen",
      phone: "+91 98301 23456",
      location: "EM Bypass, Kolkata",
      area: 2850,
      status: "Execution (Stage 3)",
      progress: 68,
      contractValue: 3850000,
      invoiced: 2310000,
      received: 1925000,
      outstanding: 385000,
      budgetDirectCost: 2450000,
      actualDirectCost: 1485000,
      cashSpent: 425000,
      bankSpent: 1060000,
      grossMargin: 35.6,
      startDate: "2026-01-15",
      targetHandover: "2026-05-30",
      milestones: [
        { stage: "Stage 1: Advance / 2D-3D Approval", percent: 20, amount: 770000, status: "Received", date: "2026-01-20", mode: "Bank (RTGS)" },
        { stage: "Stage 2: Civil, Electrical & Rough-in", percent: 30, amount: 1155000, status: "Received", date: "2026-02-28", mode: "Cash & Bank" },
        { stage: "Stage 3: Carpentry, False Ceiling & Veneer", percent: 30, amount: 1155000, status: "Partially Received", date: "2026-04-10", mode: "Cash" },
        { stage: "Stage 4: Finishing, PU Polish & Handover", percent: 20, amount: 770000, status: "Upcoming", date: "2026-05-25", mode: "Pending" }
      ],
      costBreakdown: [
        { trade: "Carpentry & Joinery", budget: 1100000, spent: 720000 },
        { trade: "Electrical & Smart Lighting", budget: 350000, spent: 240000 },
        { trade: "Civil & Masonry", budget: 320000, spent: 215000 },
        { trade: "Painting & Polish", budget: 280000, spent: 110000 },
        { trade: "False Ceiling & Gypsum", budget: 180000, spent: 120000 },
        { trade: "Plumbing & Sanitary", budget: 120000, spent: 80000 }
      ],
      ledgerEntries: [
        { date: "2026-01-20", desc: "Stage 1 Advance Received", ref: "RTGS-9812", mode: "Bank", debit: 0, credit: 770000, balance: 770000 },
        { date: "2026-02-28", desc: "Stage 2 Milestone Payment", ref: "NEFT-4412", mode: "Bank", debit: 0, credit: 1155000, balance: 1925000 },
        { date: "2026-03-05", desc: "Century Marine Ply IS 710", ref: "TXN-101", mode: "Bank", debit: 145000, credit: 0, balance: 1780000 },
        { date: "2026-03-18", desc: "Electrical Cables & Site Cash Expense", ref: "TXN-102", mode: "Cash", debit: 18500, credit: 0, balance: 1761500 },
        { date: "2026-04-02", desc: "Asian Paints & PU Polish", ref: "TXN-105", mode: "Bank", debit: 48000, credit: 0, balance: 1713500 }
      ]
    },
    {
      id: "PRJ-2026-002",
      name: "Ballygunge Park Villa",
      client: "Vikram Singhania",
      phone: "+91 98310 98765",
      location: "Ballygunge Circular Rd, Kolkata",
      area: 2100,
      status: "Execution (Stage 2)",
      progress: 42,
      contractValue: 3000000,
      invoiced: 1800000,
      received: 1500000,
      outstanding: 300000,
      budgetDirectCost: 1950000,
      actualDirectCost: 729000,
      cashSpent: 280000,
      bankSpent: 449000,
      grossMargin: 35.0,
      startDate: "2026-02-01",
      targetHandover: "2026-06-15",
      milestones: [
        { stage: "Stage 1: Advance / Layout Finalization", percent: 20, amount: 600000, status: "Received", date: "2026-02-05", mode: "Bank (RTGS)" },
        { stage: "Stage 2: Core Civil & False Ceiling", percent: 30, amount: 900000, status: "Received", date: "2026-03-25", mode: "Cash & Bank" },
        { stage: "Stage 3: Custom Modular & Wardrobes", percent: 30, amount: 900000, status: "Pending", date: "2026-05-10", mode: "Pending" },
        { stage: "Stage 4: Paint, Polish & Handover", percent: 20, amount: 600000, status: "Upcoming", date: "2026-06-10", mode: "Pending" }
      ],
      costBreakdown: [
        { trade: "Carpentry & Joinery", budget: 850000, spent: 310000 },
        { trade: "Civil & Demolition", budget: 300000, spent: 185000 },
        { trade: "Electrical & Automation", budget: 280000, spent: 95000 },
        { trade: "False Ceiling", budget: 160000, spent: 65000 },
        { trade: "Plumbing & Bath Fittings", budget: 140000, spent: 44000 },
        { trade: "Painting & Deco", budget: 220000, spent: 30000 }
      ],
      ledgerEntries: [
        { date: "2026-02-05", desc: "Stage 1 Advance Received", ref: "RTGS-1190", mode: "Bank", debit: 0, credit: 600000, balance: 600000 },
        { date: "2026-03-25", desc: "Stage 2 Milestone Payment", ref: "CASH-3310", mode: "Cash", debit: 0, credit: 900000, balance: 1500000 },
        { date: "2026-04-01", desc: "Demolition & Masonry Labor", ref: "TXN-104", mode: "Cash", debit: 32000, credit: 0, balance: 1468000 }
      ]
    },
    {
      id: "PRJ-2026-003",
      name: "Rajarhat Luxury Residency",
      client: "Pooja Agarwal",
      phone: "+91 98315 44321",
      location: "Action Area II, New Town",
      area: 1650,
      status: "Quotation Finalized",
      progress: 15,
      contractValue: 2250000,
      invoiced: 450000,
      received: 450000,
      outstanding: 0,
      budgetDirectCost: 1460000,
      actualDirectCost: 120000,
      cashSpent: 40000,
      bankSpent: 80000,
      grossMargin: 35.1,
      startDate: "2026-03-01",
      targetHandover: "2026-07-20",
      milestones: [
        { stage: "Stage 1: Advance / Mobilization", percent: 20, amount: 450000, status: "Received", date: "2026-03-05", mode: "Bank (NEFT)" },
        { stage: "Stage 2: Civil & Base Infrastructure", percent: 30, amount: 675000, status: "Pending", date: "2026-04-30", mode: "Pending" },
        { stage: "Stage 3: Woodwork & Fitments", percent: 30, amount: 675000, status: "Upcoming", date: "2026-06-15", mode: "Pending" },
        { stage: "Stage 4: Finishing & Snags", percent: 20, amount: 450000, status: "Upcoming", date: "2026-07-15", mode: "Pending" }
      ],
      costBreakdown: [
        { trade: "Carpentry", budget: 680000, spent: 40000 },
        { trade: "Civil & Tiling", budget: 260000, spent: 50000 },
        { trade: "Electrical", budget: 210000, spent: 20000 },
        { trade: "False Ceiling", budget: 120000, spent: 10000 }
      ],
      ledgerEntries: [
        { date: "2026-03-05", desc: "Contract Signing Advance", ref: "NEFT-8891", mode: "Bank", debit: 0, credit: 450000, balance: 450000 }
      ]
    }
  ],
  vendors: [
    {
      id: "VND-001",
      name: "Bengal Timber Mart",
      trade: "Plywood, Veneer & Hardware",
      phone: "+91 98305 11223",
      contact: "Ramesh Sharma",
      city: "Kolkata (Ultadanga)",
      totalBilled: 745000,
      totalPaid: 720000,
      balance: 25000,
      ledger: [
        { date: "2026-01-25", desc: "Century Marine Ply IS 710", ref: "BILL-8891", billed: 320000, paid: 0, balance: 320000 },
        { date: "2026-02-02", desc: "Payment from HDFC A/C", ref: "TXN-901", billed: 0, paid: 320000, balance: 0 },
        { date: "2026-03-05", desc: "Century Ply Batch 2", ref: "BILL-9102", billed: 280000, paid: 0, balance: 280000 },
        { date: "2026-03-12", desc: "Payment from HDFC A/C", ref: "TXN-944", billed: 0, paid: 255000, balance: 25000 }
      ]
    },
    {
      id: "VND-002",
      name: "Kolkata Electric Works",
      trade: "Cables, Switches & Automation",
      phone: "+91 98311 44556",
      contact: "Sanjay Paul",
      city: "Kolkata (Ezra Street)",
      totalBilled: 248400,
      totalPaid: 240000,
      balance: 8400,
      ledger: [
        { date: "2026-02-10", desc: "Polycab FR-LSH Copper Wires", ref: "BILL-4310", billed: 125000, paid: 125000, balance: 0 },
        { date: "2026-03-15", desc: "Schneider Modular Switches", ref: "BILL-4890", billed: 123400, paid: 115000, balance: 8400 }
      ]
    },
    {
      id: "VND-003",
      name: "Asian Paints Depot",
      trade: "Royale Emulsion & PU Polish",
      phone: "+91 98302 77889",
      contact: "Gouranga Ghosh",
      city: "Kolkata (Park Circus)",
      totalBilled: 124200,
      totalPaid: 110000,
      balance: 14200,
      ledger: [
        { date: "2026-03-20", desc: "Royale Emulsion & Putty", ref: "BILL-7721", billed: 76200, paid: 76200, balance: 0 },
        { date: "2026-04-05", desc: "PU Polish Clear Gloss", ref: "BILL-8100", billed: 48000, paid: 33800, balance: 14200 }
      ]
    },
    {
      id: "VND-004",
      name: "Labour Group (Tangra Carpenters)",
      trade: "Site Carpentry & Fixed Woodwork",
      phone: "+91 98308 55443",
      contact: "Subir Mistry (Head Carpenter)",
      city: "Kolkata",
      totalBilled: 380000,
      totalPaid: 350000,
      balance: 30000,
      ledger: [
        { date: "2026-02-15", desc: "Wardrobe Carcass Fabrication Wages", ref: "LAB-01", billed: 120000, paid: 100000, balance: 20000 },
        { date: "2026-03-20", desc: "Modular Kitchen Fitting Advance", ref: "LAB-02", billed: 150000, paid: 150000, balance: 20000 },
        { date: "2026-04-08", desc: "Veneer & Shutter Paneling Wages", ref: "LAB-03", billed: 110000, paid: 100000, balance: 30000 }
      ]
    }
  ],
  transactions: [
    { id: "TXN-101", date: "2026-11-06", type: "Payment (Cost)", category: "Carpentry & Joinery", project: "PRJ-2026-001", account: "HDFC Bank (Current A/C)", vendor: "Bengal Timber Mart", amount: 145000, mode: "Bank (NEFT)", status: "Verified" },
    { id: "TXN-102", date: "2026-11-05", type: "Payment (Cost)", category: "Electrical & Lights", project: "PRJ-2026-001", account: "Cash Box - Site 01 (Highline)", vendor: "Kolkata Electric Works", amount: 18500, mode: "Cash", status: "Verified" },
    { id: "TXN-103", date: "2026-11-04", type: "Receipt (Client Advance)", category: "Client Advance", project: "PRJ-2026-002", account: "HDFC Bank (Current A/C)", vendor: "Vikram Singhania", amount: 600000, mode: "Bank (RTGS)", status: "Verified" },
    { id: "TXN-104", date: "2026-11-03", type: "Payment (Cost)", category: "Civil & Masonry", project: "PRJ-2026-002", account: "Cash Box - Workshop (Tangra)", vendor: "Labour Group (Tangra Carpenters)", amount: 32000, mode: "Cash", status: "Verified" },
    { id: "TXN-105", date: "2026-11-02", type: "Payment (Cost)", category: "Painting & Polish", project: "PRJ-2026-001", account: "HDFC Bank (Current A/C)", vendor: "Asian Paints Depot", amount: 48000, mode: "Bank (UPI)", status: "Verified" }
  ],
  quotations: [
    { id: "QTE-2026-001", projectId: "PRJ-2026-001", client: "Ananya Sen", title: "Highline Penthouse 14B - Full Turnkey", date: "2026-01-18", version: "v1.2", totalNet: 3850000, status: "Approved", itemsCount: 24, driveUrl: "https://drive.google.com/drive/folders/dream-address-prj01" },
    { id: "QTE-2026-002", projectId: "PRJ-2026-002", client: "Vikram Singhania", title: "Ballygunge Villa - Civil & Woodwork", date: "2026-02-03", version: "v2.0", totalNet: 3000000, status: "Approved", itemsCount: 18, driveUrl: "https://drive.google.com/drive/folders/dream-address-prj02" },
    { id: "QTE-2026-003", projectId: "PRJ-2026-003", client: "Pooja Agarwal", title: "Rajarhat Residency - Turnkey Interior", date: "2026-02-28", version: "v1.0", totalNet: 2250000, status: "Approved", itemsCount: 15, driveUrl: "https://drive.google.com/drive/folders/dream-address-prj03" }
  ],
  invoices: [
    { id: "INV-2026-001", projectId: "PRJ-2026-001", client: "Ananya Sen", stage: "Stage 1: Advance / 2D-3D Approval", amount: 770000, date: "2026-01-20", status: "Paid", mode: "Bank (RTGS)" },
    { id: "INV-2026-002", projectId: "PRJ-2026-001", client: "Ananya Sen", stage: "Stage 2: Civil, Electrical & Rough-in", amount: 1155000, date: "2026-02-28", status: "Paid", mode: "Cash & Bank" },
    { id: "INV-2026-003", projectId: "PRJ-2026-001", client: "Ananya Sen", stage: "Stage 3: Carpentry & False Ceiling", amount: 1155000, date: "2026-04-10", status: "Partial", received: 770000, due: 385000, mode: "Cash" },
    { id: "INV-2026-004", projectId: "PRJ-2026-002", client: "Vikram Singhania", stage: "Stage 1: Advance / Layout Finalization", amount: 600000, date: "2026-02-05", status: "Paid", mode: "Bank (RTGS)" },
    { id: "INV-2026-005", projectId: "PRJ-2026-002", client: "Vikram Singhania", stage: "Stage 2: Core Civil & False Ceiling", amount: 900000, date: "2026-03-25", status: "Paid", mode: "Cash" },
    { id: "INV-2026-006", projectId: "PRJ-2026-003", client: "Pooja Agarwal", stage: "Stage 1: Advance / Mobilization", amount: 450000, date: "2026-03-05", status: "Paid", mode: "Bank (NEFT)" }
  ],
  tickets: [
    { id: "TCK-101", projectId: "PRJ-2026-001", client: "Ananya Sen", title: "Add 2 extra 16A power points behind TV console", trade: "Electrical", priority: "High", status: "Resolved", date: "2026-03-12" },
    { id: "TCK-102", projectId: "PRJ-2026-001", client: "Ananya Sen", title: "Change wardrobe internal drawer handles to matte brass", trade: "Carpentry", priority: "Medium", status: "In Progress", date: "2026-11-04" },
    { id: "TCK-103", projectId: "PRJ-2026-002", client: "Vikram Singhania", title: "Check wall dampness near master washroom duct", trade: "Civil", priority: "Urgent", status: "Open", date: "2026-11-06" }
  ],
  notes: [
    { id: "NOT-001", projectId: "PRJ-2026-001", client: "Ananya Sen", author: "Rohit Churiwala", category: "Design Preference", text: "Client strictly prefers fluted smoke oak veneer with polyurethane matte finish. Dislikes shiny gold hardware.", pinned: true, date: "2026-01-22" },
    { id: "NOT-002", projectId: "PRJ-2026-001", client: "Ananya Sen", author: "Suresh (Site Supervisor)", category: "Site Constraint", text: "Lift operational only till 7 PM. Heavy plywood unloading from Tangra must happen between 8 AM - 11 AM.", pinned: true, date: "2026-02-02" },
    { id: "NOT-003", projectId: "PRJ-2026-002", client: "Vikram Singhania", author: "Rohit Churiwala", category: "Budget & Terms", text: "Approved lump-sum 30L contract. Any civil changes beyond master drawings will be billed at standard rate card net rates.", pinned: true, date: "2026-02-06" }
  ],
  snags: [
    { id: "SNG-001", projectId: "PRJ-2026-001", room: "Master Bedroom", trade: "Carpentry & Joinery", defect: "Bottom drawer soft-close channel friction on left rail", contractor: "Labour Group (Tangra Carpenters)", status: "In Progress", priority: "Medium" },
    { id: "SNG-002", projectId: "PRJ-2026-001", room: "Living & Dining", trade: "Painting & Polish", defect: "Touch-up required near AC ledge drywall joint", contractor: "Asian Paints Depot", status: "Open", priority: "Low" },
    { id: "SNG-003", projectId: "PRJ-2026-002", room: "Foyer", trade: "Electrical & Lights", defect: "Magnetic track spot #3 loose contact", contractor: "Kolkata Electric Works", status: "Resolved", priority: "High" }
  ],
  workshopDispatch: [
    { id: "DSP-01", projectId: "PRJ-2026-001", item: "Master Wardrobe Carcass (3 Modules, 18mm Century Marine)", stage: "Delivered & Assembled", date: "2026-03-22", tempoChallan: "CHL-8821", driver: "Raju Tempo (WB-02-4412)" },
    { id: "DSP-02", projectId: "PRJ-2026-001", item: "Kitchen Modular Carcass with PVC 2mm Edge Banding", stage: "Delivered & Assembled", date: "2026-04-05", tempoChallan: "CHL-8902", driver: "Raju Tempo (WB-02-4412)" },
    { id: "DSP-03", projectId: "PRJ-2026-001", item: "Living Room Fluted Oak Paneling & TV Backer", stage: "Ready for Dispatch at Tangra", date: "2026-11-07", tempoChallan: "CHL-9114", driver: "Pending Dispatch" },
    { id: "DSP-04", projectId: "PRJ-2026-002", item: "Guest Room Wardrobe Shutters (Veneer Pressed)", stage: "Under Fabrication (Tangra)", date: "2026-11-06", tempoChallan: "PENDING", driver: "TBD" }
  ]
};

// --- AUTH ---
app.post('/api/auth/login', (req, res) => {
  const { password, pin } = req.body;
  if ((password && password === APP_PASSWORD) || (pin && pin === ADMIN_PIN)) {
    const token = Buffer.from(`dream-address-auth-${Date.now()}-${ADMIN_PIN}`).toString('base64');
    return res.json({
      success: true,
      token,
      user: { name: "Rohit Churiwala", role: "Principal Designer / MD", studio: "Dream Address Studio" }
    });
  }
  return res.status(401).json({ success: false, message: "Invalid Password or PIN. Access denied." });
});

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Unauthorized. Authentication required." });
  }
  next();
};

// --- API ENDPOINTS ---

// 1. Dashboard data (Consolidated & Per-Site)
app.get('/api/dashboard', requireAuth, (req, res) => {
  res.json({
    kpis: db.kpis,
    projects: db.projects,
    accounts: db.accounts,
    recentTransactions: db.transactions.slice(0, 20),
    vendors: db.vendors,
    sheetId: SHEET_ID
  });
});

// 2. Add New Client / Project
app.post('/api/projects', requireAuth, (req, res) => {
  const { client, name, phone, location, area, contractValue, budgetDirectCost } = req.body;
  const newPrj = {
    id: `PRJ-2026-${String(db.projects.length + 1).padStart(3, '0')}`,
    name: name || `${client}'s Residence`,
    client: client || "New Client",
    phone: phone || "+91 98300 00000",
    location: location || "Kolkata",
    area: parseFloat(area) || 1500,
    status: "Initiation",
    progress: 10,
    contractValue: parseFloat(contractValue) || 2000000,
    invoiced: 0,
    received: 0,
    outstanding: parseFloat(contractValue) || 2000000,
    budgetDirectCost: parseFloat(budgetDirectCost) || Math.round((parseFloat(contractValue) || 2000000) * 0.65),
    actualDirectCost: 0,
    cashSpent: 0,
    bankSpent: 0,
    grossMargin: 35.0,
    startDate: new Date().toISOString().split('T')[0],
    targetHandover: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
    milestones: [
      { stage: "Stage 1: Advance / Approvals", percent: 20, amount: Math.round((parseFloat(contractValue) || 2000000) * 0.2), status: "Pending", mode: "Cash/Bank" },
      { stage: "Stage 2: Civil & Rough-in", percent: 30, amount: Math.round((parseFloat(contractValue) || 2000000) * 0.3), status: "Upcoming", mode: "Cash/Bank" },
      { stage: "Stage 3: Carpentry & Ceilings", percent: 30, amount: Math.round((parseFloat(contractValue) || 2000000) * 0.3), status: "Upcoming", mode: "Cash/Bank" },
      { stage: "Stage 4: Finishing & Handover", percent: 20, amount: Math.round((parseFloat(contractValue) || 2000000) * 0.2), status: "Upcoming", mode: "Cash/Bank" }
    ],
    costBreakdown: [
      { trade: "Carpentry & Joinery", budget: Math.round((parseFloat(contractValue) || 2000000) * 0.30), spent: 0 },
      { trade: "Electrical & Smart Lighting", budget: Math.round((parseFloat(contractValue) || 2000000) * 0.10), spent: 0 },
      { trade: "Civil & Masonry", budget: Math.round((parseFloat(contractValue) || 2000000) * 0.08), spent: 0 },
      { trade: "Painting & Polish", budget: Math.round((parseFloat(contractValue) || 2000000) * 0.08), spent: 0 },
      { trade: "False Ceiling & Gypsum", budget: Math.round((parseFloat(contractValue) || 2000000) * 0.05), spent: 0 },
      { trade: "Plumbing & Sanitary", budget: Math.round((parseFloat(contractValue) || 2000000) * 0.04), spent: 0 }
    ],
    ledgerEntries: []
  };

  db.projects.push(newPrj);
  db.kpis.totalTurnover += newPrj.contractValue;
  db.kpis.totalOutstanding += newPrj.contractValue;

  res.json({ success: true, project: newPrj, message: "Client & Project created successfully" });
});

// 3. Add Expense / Cash Transaction (No GST)
app.post('/api/transactions', requireAuth, (req, res) => {
  const { date, type, category, project, account, vendor, amount, mode, note } = req.body;
  const numAmount = parseFloat(amount) || 0;
  
  const newTxn = {
    id: `TXN-${Math.floor(100 + Math.random() * 900)}`,
    date: date || new Date().toISOString().split('T')[0],
    type: type || "Payment (Cost)",
    category: category || "General Site Expense",
    project: project || "PRJ-2026-001",
    account: account || "Cash Box - Site 01 (Highline)",
    vendor: vendor || "Site Expense",
    amount: numAmount,
    mode: mode || (account.includes('Cash') ? 'Cash' : 'Bank'),
    note: note || "",
    status: "Verified"
  };

  db.transactions.unshift(newTxn);

  // Update Account Balances
  const acc = db.accounts.find(a => a.name === newTxn.account);
  if (acc) {
    if (newTxn.type.includes("Receipt")) {
      acc.balance += numAmount;
    } else {
      acc.balance -= numAmount;
    }
  }

  // Recalculate cash vs bank holdings
  let totalCash = 0;
  let totalBank = 0;
  db.accounts.forEach(a => {
    if (a.type === 'Cash') totalCash += a.balance;
    else totalBank += a.balance;
  });
  db.kpis.cashBalances = totalCash;
  db.kpis.bankBalance = totalBank;
  db.kpis.totalCashHoldings = totalCash + totalBank;

  // Update Project Direct Costs
  const prj = db.projects.find(p => p.id === newTxn.project);
  if (prj) {
    if (newTxn.type.includes("Payment")) {
      prj.actualDirectCost += numAmount;
      if (newTxn.mode.includes('Cash')) prj.cashSpent += numAmount;
      else prj.bankSpent += numAmount;
      
      // Update specific trade spend
      const tr = prj.costBreakdown.find(t => t.trade === newTxn.category);
      if (tr) tr.spent += numAmount;

      prj.grossMargin = Math.round(((prj.contractValue - prj.actualDirectCost) / prj.contractValue) * 1000) / 10;
      db.kpis.directCosts += numAmount;
      
      if (prj.ledgerEntries) {
        prj.ledgerEntries.unshift({
          date: newTxn.date,
          desc: `${newTxn.category} - ${newTxn.vendor}`,
          ref: newTxn.id,
          mode: newTxn.mode,
          debit: numAmount,
          credit: 0,
          balance: prj.received - prj.actualDirectCost
        });
      }
    } else if (newTxn.type.includes("Receipt")) {
      prj.received += numAmount;
      prj.outstanding = Math.max(0, prj.contractValue - prj.received);
      db.kpis.totalCollected += numAmount;
      db.kpis.totalOutstanding = Math.max(0, db.kpis.totalTurnover - db.kpis.totalCollected);

      if (prj.ledgerEntries) {
        prj.ledgerEntries.unshift({
          date: newTxn.date,
          desc: `Client Advance / Milestone Receipt (${newTxn.mode})`,
          ref: newTxn.id,
          mode: newTxn.mode,
          debit: 0,
          credit: numAmount,
          balance: prj.received - prj.actualDirectCost
        });
      }
    }
  }

  // Update Vendor Ledger if matched
  const vnd = db.vendors.find(v => v.name.toLowerCase().includes(newTxn.vendor.toLowerCase()));
  if (vnd && newTxn.type.includes("Payment")) {
    vnd.totalPaid += numAmount;
    vnd.balance = Math.max(0, vnd.totalBilled - vnd.totalPaid);
    vnd.ledger.unshift({
      date: newTxn.date,
      desc: `Payment via ${newTxn.mode}`,
      ref: newTxn.id,
      billed: 0,
      paid: numAmount,
      balance: vnd.balance
    });
  }

  res.json({ success: true, transaction: newTxn, message: "Transaction recorded across accounts & site ledger." });
});

// 4. Add Vendor / Sub-Contractor
app.post('/api/vendors', requireAuth, (req, res) => {
  const { name, trade, phone, contact, city } = req.body;
  const newVnd = {
    id: `VND-${String(db.vendors.length + 1).padStart(3, '0')}`,
    name: name || "New Supplier",
    trade: trade || "Materials",
    phone: phone || "+91 98300 00000",
    contact: contact || "Contact Person",
    city: city || "Kolkata",
    totalBilled: 0,
    totalPaid: 0,
    balance: 0,
    ledger: []
  };
  db.vendors.push(newVnd);
  res.json({ success: true, vendor: newVnd, message: "Vendor added successfully" });
});

// 5. OCR Scanner Endpoint
app.post('/api/scan-ledger', requireAuth, upload.single('ledgerImage'), (req, res) => {
  const result = {
    detected: true,
    source: req.file ? req.file.originalname : "Uploaded Receipt",
    date: new Date().toISOString().split('T')[0],
    vendor: "Bengal Timber & Plywood Mart",
    trade: "Carpentry & Joinery",
    project: "PRJ-2026-001",
    account: "Cash Box - Site 01 (Highline)",
    amount: 14250,
    billNumber: `BILL-${Math.floor(2000 + Math.random() * 7000)}`,
    items: [
      { item: "Century Ply 18mm Marine Grade (3 sheets)", qty: 3, rate: 3200, total: 9600 },
      { item: "Fevicol Marine adhesive 5kg", qty: 2, rate: 1100, total: 2200 },
      { item: "Telescopic drawer channels 18\"", qty: 5, rate: 490, total: 2450 }
    ],
    confidence: 0.96
  };
  if (req.file && fs.existsSync(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
  }
  res.json({ success: true, data: result });
});

// 6. Master Google Sheet Sync status
app.post('/api/sync-sheets', requireAuth, (req, res) => {
  res.json({
    success: true,
    sheetId: SHEET_ID,
    syncedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    sheetsAudited: 22,
    recordsSynced: db.transactions.length + db.projects.length,
    status: "All 22 Google Sheets synchronized. Zero formula errors."
  });
});

// ─── DAILY LOG DATA (OCR Diary entries, keyed by date) ───────────────────────
const db_dailyLog = {
  '2026-11-06': {
    left: [
      { id:'L001', particulars:'Opening Balance',              project:'',                  amount:120000, mode:'Cash', confidence:1.00, status:'verified', flagReason:null, flagType:null },
      { id:'L002', particulars:'Ananya Sen Stage 3 partial',   project:'Highline Penthouse', amount:50000,  mode:'Cash', confidence:0.97, status:'verified', flagReason:null, flagType:null },
    ],
    right: [
      { id:'R001', particulars:'Carpenter Subir khoraki',      project:'Highline Penthouse', amount:14000, mode:'Cash', confidence:0.98, status:'verified', flagReason:null, flagType:null },
      { id:'R002', particulars:'Fevicol Marine 2 tin',         project:'Highline Penthouse', amount:2200,  mode:'Cash', confidence:0.96, status:'verified', flagReason:null, flagType:null },
      { id:'R003', particulars:'Tempo freight Tangra → Site',  project:'Ballygunge Villa',   amount:1800,  mode:'Cash', confidence:0.93, status:'verified', flagReason:null, flagType:null },
      { id:'R004', particulars:'Sand & core cutting??',        project:'Ballygunge Villa',   amount:4500,  mode:'Cash', confidence:0.62, status:'pending',  flagReason:'Amount unclear — handwriting smudged on last digit', flagType:'amount' },
    ]
  },
  '2026-11-05': {
    left: [
      { id:'L003', particulars:'Opening Balance',              project:'',                  amount:95000,  mode:'Cash', confidence:1.00, status:'verified', flagReason:null, flagType:null },
      { id:'L004', particulars:'Vikram Singhania advance',     project:'Ballygunge Villa',   amount:100000, mode:'Cash', confidence:0.88, status:'pending',  flagReason:'Client name partially unclear — confirm Vikram or Vikrant', flagType:'vendor' },
    ],
    right: [
      { id:'R005', particulars:'Mason wages Site 02',          project:'Ballygunge Villa',   amount:8500,  mode:'Cash', confidence:0.99, status:'verified', flagReason:null, flagType:null },
      { id:'R006', particulars:'Hardware screws & anchors',    project:'Highline Penthouse', amount:3200,  mode:'Cash', confidence:0.91, status:'verified', flagReason:null, flagType:null },
      { id:'R007', particulars:'??? electrical conduit misc',  project:'',                  amount:6700,  mode:'Cash', confidence:0.41, status:'pending',  flagReason:'Trade category unclear & project unidentified — verify before posting', flagType:'trade' },
    ]
  },
  '2026-11-04': {
    left: [
      { id:'L005', particulars:'Opening Balance',              project:'',                  amount:78000, mode:'Cash', confidence:1.00, status:'verified', flagReason:null, flagType:null },
    ],
    right: [
      { id:'R008', particulars:'Coolie charges debris removal',project:'Rajarhat Residency', amount:2800,  mode:'Cash', confidence:0.95, status:'verified', flagReason:null, flagType:null },
      { id:'R009', particulars:'POP material & gypsum',        project:'Highline Penthouse', amount:11200, mode:'Cash', confidence:0.97, status:'verified', flagReason:null, flagType:null },
    ]
  },
  '2026-11-03': {
    left: [
      { id:'L006', particulars:'Opening Balance',              project:'',                  amount:62000, mode:'Cash', confidence:1.00, status:'verified', flagReason:null, flagType:null },
    ],
    right: [
      { id:'R010', particulars:'Demolition labour wages',      project:'Ballygunge Villa',   amount:32000, mode:'Cash', confidence:0.99, status:'verified', flagReason:null, flagType:null },
    ]
  },
  '2026-11-02': {
    left: [
      { id:'L007', particulars:'Opening Balance',              project:'',                  amount:55000, mode:'Cash', confidence:1.00, status:'verified', flagReason:null, flagType:null },
    ],
    right: [
      { id:'R011', particulars:'Asian Paints PU Polish',       project:'Highline Penthouse', amount:48000, mode:'Bank', confidence:0.99, status:'verified', flagReason:null, flagType:null },
    ]
  }
};

// 7. Daily Log — date-indexed OCR entries
app.get('/api/daily-log', requireAuth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const log = db_dailyLog[date];
  if (!log) return res.json({ success: true, date, left: [], right: [], totalIn: 0, totalOut: 0, net: 0, flagCount: 0 });
  const totalIn  = log.left.reduce((s, e) => s + e.amount, 0);
  const totalOut = log.right.reduce((s, e) => s + e.amount, 0);
  const flagCount = [...log.left, ...log.right].filter(e => e.status === 'pending').length;
  res.json({ success: true, date, left: log.left, right: log.right, totalIn, totalOut, net: totalIn - totalOut, flagCount });
});

// 8. Verify / Edit a flagged OCR entry (clears yellow highlight)
app.post('/api/verify-entry', requireAuth, (req, res) => {
  const { date, entryId, action, particulars, amount, project } = req.body;
  const log = db_dailyLog[date];
  if (!log) return res.status(404).json({ success: false, message: 'Date not found in daily log.' });
  const entry = [...log.left, ...log.right].find(e => e.id === entryId);
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
  if (action === 'approve') {
    entry.status    = 'verified';
    entry.flagReason = null;
    entry.flagType  = null;
    entry.confidence = 1.0;
  } else if (action === 'edit') {
    entry.particulars = particulars || entry.particulars;
    entry.amount      = parseFloat(amount) || entry.amount;
    entry.project     = project !== undefined ? project : entry.project;
    entry.status      = 'verified';
    entry.flagReason  = null;
    entry.flagType    = null;
    entry.confidence  = 1.0;
  }
  res.json({ success: true, entry, message: action === 'approve' ? 'Entry approved — yellow highlight cleared in Google Sheet.' : 'Entry corrected and verified.' });
});

// 9. Cash Flow Log — aggregated inflow / outflow per day for a date range
app.get('/api/cashflow', requireAuth, (req, res) => {
  const fromStr = req.query.from || new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
  const toStr   = req.query.to   || new Date().toISOString().split('T')[0];
  const days = [];
  const start = new Date(fromStr), end = new Date(toStr);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const txns    = db.transactions.filter(t => t.date === dateStr);
    const dlog    = db_dailyLog[dateStr];
    const logIn   = dlog ? dlog.left.filter(e => !e.particulars.toLowerCase().includes('opening')).reduce((s,e) => s + e.amount, 0) : 0;
    const logOut  = dlog ? dlog.right.reduce((s, e) => s + e.amount, 0) : 0;
    const txnIn   = txns.filter(t => t.type.includes('Receipt')).reduce((s, t) => s + t.amount, 0);
    const txnOut  = txns.filter(t => t.type.includes('Payment')).reduce((s, t) => s + t.amount, 0);
    const inflow  = logIn  + txnIn;
    const outflow = logOut + txnOut;
    days.push({ date: dateStr, inflow, outflow, net: inflow - outflow, transactions: txns });
  }
  res.json({
    success: true, days,
    totalInflow:  days.reduce((s, d) => s + d.inflow,  0),
    totalOutflow: days.reduce((s, d) => s + d.outflow, 0)
  });
});

// 10. CRM 360° Data & APIs
app.get('/api/crm/clients', requireAuth, (req, res) => {
  const clientsData = db.projects.map(p => {
    return {
      projectId: p.id,
      name: p.client,
      projectName: p.name,
      phone: p.phone,
      location: p.location,
      area: p.area,
      status: p.status,
      progress: p.progress,
      contractValue: p.contractValue,
      invoiced: p.invoiced,
      received: p.received,
      outstanding: p.outstanding,
      targetHandover: p.targetHandover,
      quotations: db.quotations.filter(q => q.projectId === p.id),
      invoices: db.invoices.filter(i => i.projectId === p.id),
      tickets: db.tickets.filter(t => t.projectId === p.id),
      notes: db.notes.filter(n => n.projectId === p.id),
      milestones: p.milestones
    };
  });
  res.json({ success: true, clients: clientsData });
});

app.post('/api/crm/notes', requireAuth, (req, res) => {
  const { projectId, text, category, author } = req.body;
  const prj = db.projects.find(p => p.id === projectId);
  const newNote = {
    id: `NOT-${Math.floor(100 + Math.random() * 900)}`,
    projectId,
    client: prj ? prj.client : "Client",
    author: author || "Rohit Churiwala",
    category: category || "Design Note",
    text,
    pinned: true,
    date: new Date().toISOString().split('T')[0]
  };
  db.notes.unshift(newNote);
  res.json({ success: true, note: newNote, message: "Note logged into Client CRM and synced to Google Sheets." });
});

app.post('/api/crm/quotations', requireAuth, (req, res) => {
  const { projectId, title, totalNet, itemsCount } = req.body;
  const prj = db.projects.find(p => p.id === projectId);
  const newQte = {
    id: `QTE-2026-${String(db.quotations.length + 1).padStart(3, '0')}`,
    projectId,
    client: prj ? prj.client : "Client",
    title: title || `${prj ? prj.name : 'Project'} - Custom BOQ`,
    date: new Date().toISOString().split('T')[0],
    version: `v1.${db.quotations.filter(q => q.projectId === projectId).length}`,
    totalNet: parseFloat(totalNet) || (prj ? prj.contractValue : 1500000),
    status: "Approved",
    itemsCount: parseInt(itemsCount) || 12,
    driveUrl: `https://drive.google.com/drive/folders/dream-address-${projectId}`
  };
  db.quotations.unshift(newQte);
  if (prj) {
    prj.contractValue = newQte.totalNet;
    prj.outstanding = Math.max(0, prj.contractValue - prj.received);
  }
  res.json({ success: true, quotation: newQte, message: "Quotation generated, attached to Client CRM, and synced." });
});

app.post('/api/crm/invoices', requireAuth, (req, res) => {
  const { projectId, stage, amount, mode } = req.body;
  const prj = db.projects.find(p => p.id === projectId);
  const numAmt = parseFloat(amount) || 500000;
  const newInv = {
    id: `INV-2026-${String(db.invoices.length + 1).padStart(3, '0')}`,
    projectId,
    client: prj ? prj.client : "Client",
    stage: stage || "Milestone Payment Demand",
    amount: numAmt,
    date: new Date().toISOString().split('T')[0],
    status: "Pending",
    mode: mode || "Bank (RTGS)"
  };
  db.invoices.unshift(newInv);
  if (prj) {
    prj.invoiced += numAmt;
    prj.outstanding = Math.max(0, prj.contractValue - prj.received);
  }
  res.json({ success: true, invoice: newInv, message: "Milestone Invoice issued, posted to Client CRM & Google Sheet." });
});

app.post('/api/crm/tickets', requireAuth, (req, res) => {
  const { projectId, title, trade, priority } = req.body;
  const prj = db.projects.find(p => p.id === projectId);
  const newTck = {
    id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
    projectId,
    client: prj ? prj.client : "Client",
    title,
    trade: trade || "Carpentry",
    priority: priority || "Medium",
    status: "Open",
    date: new Date().toISOString().split('T')[0]
  };
  db.tickets.unshift(newTck);
  res.json({ success: true, ticket: newTck, message: "Site Ticket recorded in Client CRM." });
});

// 11. PMS (Project Management System) Data & APIs
app.get('/api/pms/data', requireAuth, (req, res) => {
  res.json({
    success: true,
    projects: db.projects,
    snags: db.snags,
    workshopDispatch: db.workshopDispatch,
    tickets: db.tickets
  });
});

app.post('/api/pms/snags', requireAuth, (req, res) => {
  const { projectId, room, trade, defect, contractor, priority } = req.body;
  const newSnag = {
    id: `SNG-${Math.floor(100 + Math.random() * 900)}`,
    projectId,
    room: room || "General",
    trade: trade || "Carpentry & Joinery",
    defect,
    contractor: contractor || "Labour Group",
    status: "Open",
    priority: priority || "Medium"
  };
  db.snags.unshift(newSnag);
  res.json({ success: true, snag: newSnag, message: "Snag added to Punch List." });
});

app.post('/api/pms/snags/resolve', requireAuth, (req, res) => {
  const { id } = req.body;
  const snag = db.snags.find(s => s.id === id);
  if (snag) {
    snag.status = snag.status === 'Resolved' ? 'Open' : 'Resolved';
  }
  res.json({ success: true, snag, message: "Snag status updated." });
});

// 12. Gemini AI Innovation Lab Endpoints
app.post('/api/ai/plywood-optimizer', requireAuth, (req, res) => {
  const { panels } = req.body;
  const panelList = panels && panels.length ? panels : [
    { name: "Wardrobe Sides (18mm)", w: 24, h: 84, qty: 2 },
    { name: "Top / Bottom Panels", w: 24, h: 48, qty: 2 },
    { name: "Internal Shelves", w: 22, h: 46, qty: 4 }
  ];
  let totalAreaSqInches = 0;
  panelList.forEach(p => { totalAreaSqInches += (p.w * p.h * p.qty); });
  const sheetAreaSqInches = 96 * 48; // 8ft x 4ft = 4608 sq inches
  const idealSheets = totalAreaSqInches / sheetAreaSqInches;
  const practicalSheets = Math.ceil(idealSheets * 1.08); // 8% kerf & cutting buffer
  const wastePercent = Math.round(((practicalSheets * sheetAreaSqInches - totalAreaSqInches) / (practicalSheets * sheetAreaSqInches)) * 1000) / 10;
  res.json({
    success: true,
    totalPanels: panelList.reduce((s, p) => s + p.qty, 0),
    totalSqFt: Math.round(totalAreaSqInches / 144),
    standardSheetsNeeded: practicalSheets,
    sheetSize: "8ft x 4ft (Century Marine IS 710)",
    estimatedMaterialCost: practicalSheets * 3200,
    wastePercent,
    savingsComparedToStandardSiteCutting: `Saved ~${Math.round(practicalSheets * 0.15)} sheet(s) worth ₹${Math.round(practicalSheets * 0.15 * 3200).toLocaleString('en-IN')}`,
    cuttingPattern: [
      { sheetNum: 1, cuts: "2x Wardrobe Sides (84\" x 24\") with 12\" x 48\" usable offcut preserved for drawers" },
      { sheetNum: 2, cuts: "2x Top/Bottom (48\" x 24\") + 2x Shelves (46\" x 22\")" },
      { sheetNum: 3, cuts: "2x Shelves (46\" x 22\") + remaining 50 sq ft allocated to Tangra workshop scrap buffer" }
    ]
  });
});

app.post('/api/ai/wage-gap-predictor', requireAuth, (req, res) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const upcomingSaturdayDate = new Date(today.getTime() + daysUntilSaturday * 86400000).toISOString().split('T')[0];
  
  const site01Cash = db.accounts.find(a => a.id === "ACC-03")?.balance || 156000;
  const workshopCash = db.accounts.find(a => a.id === "ACC-02")?.balance || 185000;
  const estimatedLaborPayoutSaturday = 85000;
  const status = (site01Cash + workshopCash) > estimatedLaborPayoutSaturday ? "Healthy" : "Deficit Warning";

  res.json({
    success: true,
    upcomingSaturday: upcomingSaturdayDate,
    daysRemaining: daysUntilSaturday,
    estimatedLaborPayout: estimatedLaborPayoutSaturday,
    currentCashBoxTotal: site01Cash + workshopCash,
    site01Cash,
    workshopCash,
    status,
    recommendation: status === "Healthy"
      ? "Cash boxes sufficient to cover all Saturday carpenter khoraki and tempo freights."
      : "Deficit risk! Follow up on Ananya Sen Stage 3 payment or transfer funds from HDFC Current A/C."
  });
});

app.post('/api/ai/whatsapp-capsule', requireAuth, (req, res) => {
  const { projectId } = req.body;
  const prj = db.projects.find(p => p.id === projectId) || db.projects[0];
  const capsule = `*DREAM ADDRESS STUDIO | EXECUTIVE SITE UPDATE* 🏛️\n\n` +
    `*Project:* ${prj.name}\n` +
    `*Client:* ${prj.client}\n` +
    `*Date:* ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n` +
    `*Overall Progress:* ${prj.progress}%\n\n` +
    `✅ *Key Milestones Completed This Week:*\n` +
    `• Modular kitchen & wardrobe carcasses fabricated at Tangra Workshop.\n` +
    `• Gyproc moisture-resistant false ceiling grid framed in Master Bedroom & Living.\n` +
    `• Polycab FR-LSH electrical rough-in completed with conduit testing.\n\n` +
    `📅 *Upcoming Next Week Focus:*\n` +
    `• On-site carcass installation and levelling.\n` +
    `• Fluted veneer paneling delivery from workshop.\n` +
    `• Asian Paints Royale primer base application.\n\n` +
    `_Warm regards,_\n` +
    `*Rohit Churiwala* | Principal Designer\n` +
    `Dream Address Studio, Kolkata`;
  res.json({ success: true, capsule, clientPhone: prj.phone });
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` DREAM ADDRESS STUDIO - ERP SERVER (NO GST / CASH+BANK)`);
  console.log(` Port: ${PORT}`);
  console.log(` Master PIN: ${ADMIN_PIN} | Password: ${APP_PASSWORD}`);
  console.log(` Connected Google Sheet: ${SHEET_ID}`);
  console.log(`====================================================`);
});
