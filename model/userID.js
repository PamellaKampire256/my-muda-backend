const express = require('express');
const app = express();

const db = require('../services/db');
const { check, validationResult } = require('express-validator');

app.use(express.json());

app.get('/user/:user_id', (req, res) => {
    try {
        const user_id = req.params.user_id;

        const selectSql = `
            SELECT * FROM personal_information_kyc WHERE user_id = ?
            UNION ALL
            SELECT * FROM company_information_kyc WHERE user_id = ?
            UNION ALL
            SELECT * FROM user_documents_kyc WHERE user_id = ?
        `;

        db.query(selectSql, [user_id, user_id, user_id], function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).send({ message: 'Error retrieving user information.' });
            }

            if (result.length === 0) {
                return res.status(404).send({ message: 'User not found.' });
            }

            return res.status(200).send({ message: 'User information retrieved successfully', user_information: result });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'An error occurred while retrieving user information.' });
    }
});

module.exports = app;
