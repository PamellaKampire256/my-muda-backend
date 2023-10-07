const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const db = require('../services/db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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

    // Generate a random integer ID (e.g., between 1000 and 9999)
    const generatedId = Math.floor(Math.random() * 9000) + 1000;

    // Set the status to "pending"
    const status = 'pending';

    const kycSql =
      'INSERT INTO personal_information_kyc (user_id, full_name, date_of_birth, nationality, id_number, phone_number, email_address, tax_id_number, source_of_funds, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(
      kycSql,
      [
        generatedId, // Include the generated ID in the user_id field
        full_name,
        date_of_birth,
        nationality,
        id_number,
        phone_number,
        email_address,
        tax_id_number,
        source_of_funds,
        status, // Include the status
      ],
      (err, kycResult) => {
        if (err) {
          console.error('KYC insertion error:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }

        console.log('KYC data registered successfully');

        // Include the generated ID and status in the response
        res.status(200).json({
          message: 'KYC data registered successfully',
          user_id: generatedId, // Include the generated ID in the response
          status: status,
        });
      }
    );
  }
);



router.post('/create-company-details', (req, res) => {
  console.log('Incoming request body:', req.body);
  const { user_id, business_license, company_registration_certificate } = req.body;

  if (!user_id || !business_license || !company_registration_certificate) {
    return res.status(400).json({ error: 'User ID, business license, and company registration certificate are required' });
  }

  // Set the status to "pending"
  const status = 'pending';

  const insertSql = `
    INSERT INTO company_information_kyc
    (user_id, business_license, company_registration_certificate, status)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    insertSql,
    [user_id, business_license, company_registration_certificate, status], // Include user_id and status
    (err, result) => {
      if (err) {
        console.error('Database insertion error:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        console.log('Company details submitted successfully');

        // Include user_id and status in the response
        res.status(200).json({
          message: 'Company details submitted successfully',
          user_id: user_id,
          status: status,
        });
      }
    }
  );
});

router.post('/activate-user', (req, res) => {
  const { user_id } = req.body;

  // Check if the user_id exists in the personal_information_kyc table
  const personalKycSql = 'SELECT * FROM personal_information_kyc WHERE id = ?';
  db.query(personalKycSql, [user_id], (err, personalKycResult) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Check if the user_id exists in the company_information_kyc table
    const companyKycSql = 'SELECT * FROM company_information_kyc WHERE user_id = ?';
    db.query(companyKycSql, [user_id], (err, companyKycResult) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if the user_id exists in the user_documents_kyc table
      const userDocumentsKycSql = 'SELECT * FROM user_documents_kyc WHERE user_id = ?';
      db.query(userDocumentsKycSql, [user_id], (err, userDocumentsKycResult) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // If user_id exists in either table, update status to "active"
        if (personalKycResult.length > 0 || companyKycResult.length > 0 || userDocumentsKycResult.length > 0) {
          // Update status to "active" in the personal_information_kyc table
          if (personalKycResult.length > 0) {
            const updatePersonalKycSql = 'UPDATE personal_information_kyc SET status = ? WHERE id = ?';
            db.query(updatePersonalKycSql, ['active', user_id], (err) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }
            });
          }

          // Update status to "active" in the company_information_kyc table
          if (companyKycResult.length > 0) {
            const updateCompanyKycSql = 'UPDATE company_information_kyc SET status = ? WHERE user_id = ?';
            db.query(updateCompanyKycSql, ['active', user_id], (err) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }
            });
          }

          // Update status to "active" in the user_documents_kyc table
          if (userDocumentsKycResult.length > 0) {
            const updateUserDocumentsKycSql = 'UPDATE user_documents_kyc SET status = ? WHERE user_id = ?';
            db.query(updateUserDocumentsKycSql, ['active', user_id], (err) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }
            });
          }

          return res.status(200).json({ message: 'User status updated to "active"' });
        } else {
          return res.status(404).json({ error: 'User doesn\'t exist' });
        }
      });
    });
  });
});



module.exports = router;
