// registerRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection module

// Define routes related to user registration

// POST a new user registration
router.post('/', (req, res) => {
  const { username, password } = req.body;
  const newUser = { username, password };

  // Insert the new user into the 'register' table
  db.query('INSERT INTO register SET ?', newUser, (err, result) => {
    if (err) {
      console.error('Error registering user: ' + err.message);
      return res.status(500).json({ error: 'Registration failed' });
    }
    res.status(201).json({ message: 'User registered successfully', id: result.insertId });
  });
});

// GET all registered users
router.get('/', (req, res) => {
  db.query('SELECT * FROM register', (err, results) => {
    if (err) {
      console.error('Error fetching registered users: ' + err.message);
      return res.status(500).json({ error: 'Failed to fetch registered users' });
    }
    res.json(results);
  });
});

// GET a specific registered user by ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM register WHERE id = ?', userId, (err, results) => {
    if (err) {
      console.error('Error fetching registered user: ' + err.message);
      return res.status(500).json({ error: 'Failed to fetch registered user' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results[0]);
  });
});

// Update user registration information by ID (PUT)
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const { username, password } = req.body;
  const updatedUser = { username, password };

  db.query('UPDATE register SET ? WHERE id = ?', [updatedUser, userId], (err, result) => {
    if (err) {
      console.error('Error updating registered user: ' + err.message);
      return res.status(500).json({ error: 'Failed to update registered user' });
    }
    res.json({ message: 'User registration updated successfully' });
  });
});

// Delete a registered user by ID (DELETE)
router.delete('/:id', (req, res) => {
  const userId = req.params.id;

  db.query('DELETE FROM register WHERE id = ?', userId, (err, result) => {
    if (err) {
      console.error('Error deleting registered user: ' + err.message);
      return res.status(500).json({ error: 'Failed to delete registered user' });
    }
    res.json({ message: 'User registration deleted successfully' });
  });
});

module.exports = router;
