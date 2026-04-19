const path = require('path');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const buildPath = path.join(__dirname, '..', 'client', 'build');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());
app.use(express.static(buildPath));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize database
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exchange_rates (
        id SERIAL PRIMARY KEY,
        base_currency VARCHAR(3) NOT NULL,
        target_currency VARCHAR(3) NOT NULL,
        rate DECIMAL(15, 8) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(base_currency, target_currency)
      );

      CREATE TABLE IF NOT EXISTS conversion_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(15, 2) NOT NULL,
        from_currency VARCHAR(3) NOT NULL,
        to_currency VARCHAR(3) NOT NULL,
        result DECIMAL(15, 2) NOT NULL,
        rate_used DECIMAL(15, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        from_currency VARCHAR(3) NOT NULL,
        to_currency VARCHAR(3) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, from_currency, to_currency)
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

// API Routes

// Get exchange rate
app.get('/api/rate/:from/:to', async (req, res) => {
  const { from, to } = req.params;

  try {
    // Check cache (1 hour)
    const cacheQuery = `
      SELECT rate FROM exchange_rates
      WHERE base_currency = $1 AND target_currency = $2
      AND last_updated > NOW() - INTERVAL '1 hour'
    `;
    const cacheResult = await pool.query(cacheQuery, [from, to]);

    if (cacheResult.rows.length > 0) {
      return res.json({ rate: parseFloat(cacheResult.rows[0].rate), cached: true });
    }

    // Fetch from API
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || '350cf64912421bba99efdaf9';
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${from}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.result !== 'success') {
      return res.status(400).json({ error: data['error-type'] });
    }

    const rate = data.conversion_rates[to];

    // Store in cache
    await pool.query(
      'INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES ($1, $2, $3) ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate, last_updated = CURRENT_TIMESTAMP',
      [from, to, rate]
    );

    res.json({ rate, cached: false });
  } catch (error) {
    console.error('Error fetching rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert currency
app.post('/api/convert', async (req, res) => {
  const { amount, from, to, userId } = req.body;

  if (!amount || !from || !to) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const rateResponse = await fetch(`http://localhost:${port}/api/rate/${from}/${to}`);
    const rateData = await rateResponse.json();

    if (rateData.error) {
      return res.status(400).json({ error: rateData.error });
    }

    const result = amount * rateData.rate;

    // Store conversion history if user is logged in
    if (userId) {
      await pool.query(
        'INSERT INTO conversion_history (user_id, amount, from_currency, to_currency, result, rate_used) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, amount, from, to, result, rateData.rate]
      );
    }

    res.json({ result, rate: rateData.rate, cached: rateData.cached });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversion history
app.get('/api/history/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM conversion_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user favorites
app.get('/api/favorites/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM user_favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add favorite
app.post('/api/favorites', async (req, res) => {
  const { userId, from, to } = req.body;

  try {
    await pool.query(
      'INSERT INTO user_favorites (user_id, from_currency, to_currency) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, from, to]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove favorite
app.delete('/api/favorites/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM user_favorites WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    res.json({ userId: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app for any non-API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});