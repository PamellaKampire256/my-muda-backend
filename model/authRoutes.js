// authRoutes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt'); // For password hashing
const db = require('../db');


// Register a new user
router.post('/register', (req, res) => {
  const { fullname, email, password } = req.body;

  // Hash the user's password before storing it in the database
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing password: ' + err.message);
      return res.status(500).json({ error: 'Registration failed' });
    }

    // Store the username and hashed password in the 'users' table
    db.query('INSERT INTO register (fullname, email, password) VALUES (?, ?, ?)', [fullname, email, hash], (err, result) => {
      if (err) {
        console.error('Error registering user: ' + err.message);
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.status(201).json({ message: 'User registered successfully', id: result.insertId });
    });
  });
});

// Login a user
router.post('/login', (req, res) => {
  const { fullname, password } = req.body;

  // Retrieve the hashed password for the given username from the database
  db.query('SELECT * FROM register WHERE fullname = ?', fullname, (err, results) => {
    if (err) {
      console.error('Error fetching user: ' + err.message);
      return res.status(500).json({ error: 'Login failed' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];

    // Compare the provided password with the stored hashed password
    bcrypt.compare(password, user.password, (err, passwordMatch) => {
      if (err || !passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // User is authenticated
      res.json({ message: 'Login successful' });
    });
  });
});

module.exports = router;
