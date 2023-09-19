const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const db = require('../services/db');

router.post(
  '/create-personalkyc',
  [
    check('full_name').notEmpty().escape(),
    check('date_of_birth').notEmpty().isISO8601(),
    check('nationality').notEmpty().escape(),
    check('id_number').notEmpty().escape(),
    check('phone_number').notEmpty().escape(),
    check('email_address').notEmpty().isEmail().normalizeEmail(),
    check('tax_id_number').notEmpty().escape(),
    check('source_of_funds').notEmpty().escape(),
  ],
  (req, res) => {
    const {
      full_name,
      date_of_birth,
      nationality,
      id_number,
      phone_number,
      email_address,
      tax_id_number,
      source_of_funds,
    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = 1;

    const kycSql = 'INSERT INTO personal_information_kyc (full_name, date_of_birth, nationality, id_number, phone_number, email_address, tax_id_number, source_of_funds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(
      kycSql,
      [
        full_name,
        date_of_birth,
        nationality,
        id_number,
        phone_number,
        email_address,
        tax_id_number,
        source_of_funds,
      ],
      (err, kycResult) => {
        if (err) {
          console.error('KYC insertion error:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }

        console.log('KYC data registered successfully');
        res.status(201).json({ message: 'KYC data registered successfully' });
      }
    );
  }
);

module.exports = router;
