const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const db = require('../services/db'); 

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());

const secretKey = process.env.JWT_SECRET || 'your-secret-key';

const loggedInUsers = {};

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.post(
  '/register',
  [
    check('full_name').notEmpty().isLength({ min: 3 }).escape(),
    check('email').isEmail().normalizeEmail(),
    check('password').isLength({ min: 6 }),
  ],
  (req, res) => {
    const { full_name, email, password, repeat_password } = req.body;

    if (password !== repeat_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    const checkSql = 'SELECT * FROM users WHERE email = ? OR full_name = ?';
    db.query(checkSql, [email, full_name], (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      if (result.length > 0) {
        res.status(400).json({ error: 'User already exists' });
      } else {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            console.error('Password hashing error:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }

          
          const insertSql = 'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)';
          db.query(insertSql, [full_name, email, hash], (err, result) => {
            if (err) {
              console.error('Database insertion error:', err);
              res.status(500).json({ error: 'Internal server error' });
              return;
            }

            console.log('User registered successfully');
            res.status(201).json({ message: 'User registered successfully' });
          });
        });
      }
    });
  }
);


app.post('/login', [
    check('email').isEmail().normalizeEmail(),
    check('password').isLength({ min: 6 }),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email, password } = req.body;
  
    if (loggedInUsers[email]) {
      return res.status(401).json({ error: 'User already logged in' });
    }
  
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
  
      if (results.length === 0) {
        res.status(401).json({ error: 'Authentication failed' });
      } else {
        const user = results[0];
        bcrypt.compare(password, user.password, (err, result) => {
          if (err || !result) {
            res.status(401).json({ error: 'Authentication failed' });
          } else {
            loggedInUsers[email] = true;
  
            const token = jwt.sign({ userId: user.id, email: user.email }, secretKey, { expiresIn: '1h' });
            res.status(200).json({ token });
          }
        });
      }
    });
  });
  

app.get('/protected', (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(200).json({ message: 'Access granted', user: decoded });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
;

module.exports = app;