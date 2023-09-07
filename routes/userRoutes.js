// userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection module

// Define routes related to users

// GET all users
router.get('/', (req, res) => {
  db.query('SELECT * FROM register', (err, results) => {
    if (err) {
      console.error('Error fetching users: ' + err.message);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(results);
  });
});

// GET a specific user by ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', userId, (err, results) => {
    if (err) {
      console.error('Error fetching user: ' + err.message);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results[0]);
  });
});

// POST a new user
router.post('/', (req, res) => {
  const { username, password } = req.body;
  const newUser = { username, password };

  // Insert the new user into the 'users' table
  db.query('INSERT INTO register SET ?', newUser, (err, result) => {
    if (err) {
      console.error('Error adding user: ' + err.message);
      return res.status(500).json({ error: 'Failed to add user' });
    }
    res.status(201).json({ message: 'User added successfully', id: result.insertId });
  });
});

// PUT (update) a user by ID
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const updatedUser = req.body;

  // Update the user in the 'users' table
  db.query('UPDATE register SET ? WHERE id = ?', [updatedUser, userId], (err, result) => {
    if (err) {
      console.error('Error updating user: ' + err.message);
      return res.status(500).json({ error: 'Failed to update user' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

// DELETE a user by ID
router.delete('/:id', (req, res) => {
  const userId = req.params.id;

  // Delete the user from the 'users' table
  db.query('DELETE FROM register WHERE id = ?', userId, (err, result) => {
    if (err) {
      console.error('Error deleting user: ' + err.message);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
