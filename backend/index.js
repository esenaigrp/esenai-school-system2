const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://school:schoolpass@localhost:5432/schooldb';

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigrations() {
  try {
    const initSql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'init.sql'), 'utf8');
    await pool.query(initSql);
    console.log('Migrations applied.');
  } catch (err) {
    console.warn('Migration warning:', err.message);
  }
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

async function findUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email]);
  return res.rows[0];
}

// Auth (DB-backed)
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    // Demo: plaintext password check. Replace with bcrypt in production.
    if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken(user);
    res.json({ token, expires_in: 8 * 3600, role: user.role, id: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Device -> Server: submit events (persist to Postgres)
app.post('/api/v1/device/events', async (req, res) => {
  const { device_id, seq, events: incoming } = req.body;
  if (!incoming || !Array.isArray(incoming)) return res.status(400).json({ error: 'events array required' });
  try {
    const processed = [];
    for (const ev of incoming) {
      const insert = await pool.query(
        `INSERT INTO events (student_id, event_type, timestamp, source, note, reason_code) VALUES
        ((SELECT id FROM students WHERE reg_no = $1 LIMIT 1), $2, $3, $4, $5, $6) RETURNING id`,
        [ev.student_reg_no, ev.event_type, ev.timestamp, ev.source || 'BIOMETRIC', ev.note || null, ev.reason_code || null]
      );
      processed.push({ id: insert.rows[0].id, reg_no: ev.student_reg_no });
    }
    res.json({ status: 'ok', processed: processed.length, records: processed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error', detail: err.message });
  }
});

// Admin manual create event
app.post('/api/v1/admin/events', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') return res.status(403).json({ error: 'forbidden' });
    const { student_reg_no, event_type, timestamp, reason_code, note, authoriser_id } = req.body;
    const insert = await pool.query(
      `INSERT INTO events (student_id, event_type, timestamp, reason_code, note, source) VALUES
      ((SELECT id FROM students WHERE reg_no = $1 LIMIT 1), $2, $3, $4, $5, 'MANUAL') RETURNING *`,
      [student_reg_no, event_type, timestamp || new Date().toISOString(), reason_code, note]
    );
    res.status(201).json({ status: 'created', record: insert.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error', detail: err.message });
  }
});

// Parent request early leave
app.post('/api/v1/parents/:parentId/requests', async (req, res) => {
  const { parentId } = req.params;
  const { student_reg_no, type, requested_time, reason, contact_phone } = req.body;
  try {
    const insert = await pool.query(
      `INSERT INTO approvals (student_id, request_type, requested_by, status, created_at) VALUES
      ((SELECT id FROM students WHERE reg_no = $1 LIMIT 1), $2, $3, 'PENDING', now()) RETURNING *`,
      [student_reg_no, type, parentId]
    );
    res.status(201).json({ status: 'created', request: insert.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error', detail: err.message });
  }
});

// List events (admin)
app.get('/api/v1/events', authMiddleware, async (req, res) => {
  try {
    const q = await pool.query(`SELECT e.*, s.reg_no, s.first_name, s.last_name FROM events e LEFT JOIN students s ON e.student_id = s.id ORDER BY e.timestamp DESC LIMIT 200`);
    res.json({ events: q.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent: get my children & events
app.get('/api/v1/parents/me/children', authMiddleware, async (req, res) => {
  try {
    // fetch user by id
    const qUser = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const user = qUser.rows[0];
    if (!user || user.role !== 'parent') return res.status(403).json({ error: 'forbidden' });
    const q = await pool.query('SELECT s.* FROM students s WHERE s.parent_id = $1', [user.parent_id]);
    const children = q.rows;
    for (const c of children) {
      const ev = await pool.query('SELECT * FROM events WHERE student_id=$1 ORDER BY timestamp DESC LIMIT 50', [c.id]);
      c.events = ev.rows;
    }
    res.json({ children });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List approvals (admin)
app.get('/api/v1/approvals', authMiddleware, async (req, res) => {
  try {
    const q = await pool.query('SELECT * FROM approvals ORDER BY created_at DESC LIMIT 200');
    res.json({ approvals: q.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run migrations then start
(async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => console.log('Backend listening on', PORT));
  } catch (err) {
    console.error('Failed to start server', err);
  }
})();
