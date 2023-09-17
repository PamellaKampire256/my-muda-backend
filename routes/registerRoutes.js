const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { check, validationResult } = require('express-validator');


const handleDbError = (res, err, message) => {
  console.error(message, err);
  res.status(500).json({ error: 'Internal server error' });
};


const registrationValidation = [
  check('username').notEmpty().isLength({ min: 3 }).escape(),
  check('email').isEmail().normalizeEmail(),
  check('password').isLength({ min: 6 }),
];

router.post('/', registrationValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;
  const newUser = { username, email, password };

  db.query('INSERT INTO users SET ?', newUser, (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Error registering user:');
    }
    res.status(201).json({ message: 'User registered successfully', id: result.insertId });
  });
});

router.get('/', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return handleDbError(res, err, 'Error fetching registered users:');
    }
    res.json(results);
  });
});

router.get('/:id', (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', userId, (err, results) => {
    if (err) {
      return handleDbError(res, err, 'Error fetching registered user:');
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(results[0]);
  });
});

router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const { username, password } = req.body;
  const updatedUser = { username, password };

  db.query('UPDATE users SET ? WHERE id = ?', [updatedUser, userId], (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Error updating registered user:');
    }
    res.json({ message: 'User registration updated successfully' });
  });
});

router.delete('/:id', (req, res) => {
  const userId = req.params.id;

  db.query('DELETE FROM users WHERE id = ?', userId, (err, result) => {
    if (err) {
      return handleDbError(res, err, 'Error deleting registered user:');
    }
    res.json({ message: 'User registration deleted successfully' });
  });
});

module.exports = router;
