// server.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const db = require('./db');


const app = express();
const port = process.env.PORT || 3001;

// Middleware setup
app.use(bodyParser.json());

// Database connection setup (same as before)

// Import and use route files
const userRoutes = require('./routes/userRoutes');
const registerRoutes = require('./routes/registerRoutes');
const authRoutes = require('./model/authRoutes'); // Import authRoutes.js

app.use('/users', userRoutes);
app.use('/register', registerRoutes);
app.use('/auth', authRoutes); // Use authRoutes for authentication

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
