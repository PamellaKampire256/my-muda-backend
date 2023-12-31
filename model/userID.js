const express = require('express');
const app = express();

const db = require('../services/db');
const { check, validationResult } = require('express-validator');

app.use(express.json());

app.get('/user/:user_id', (req, res) => {
    try {
        const user_id = req.params.user_id;

        const selectPersonalSql = 'SELECT * FROM personal_information_kyc WHERE user_id = ?';
        const selectCompanySql = 'SELECT * FROM company_information_kyc WHERE user_id = ?';
        const selectUserDocumentsSql = 'SELECT * FROM user_documents_kyc WHERE user_id = ?';

        const personalPromise = new Promise((resolve, reject) => {
            db.query(selectPersonalSql, [user_id], (err, personalResult) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(personalResult[0] || {});
                }
            });
        });

        const companyPromise = new Promise((resolve, reject) => {
            db.query(selectCompanySql, [user_id], (err, companyResult) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(companyResult[0] || {});
                }
            });
        });

        const userDocumentsPromise = new Promise((resolve, reject) => {
            db.query(selectUserDocumentsSql, [user_id], (err, userDocumentsResult) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(userDocumentsResult[0] || {});
                }
            });
        });

        Promise.all([personalPromise, companyPromise, userDocumentsPromise])
            .then(([personalResult, companyResult, userDocumentsResult]) => {
                const user_information = {
                    ...personalResult,
                    ...companyResult,
                    ...userDocumentsResult
                };

                if (Object.keys(user_information).length === 0) {
                    return res.status(404).send({ message: 'User not found.' });
                }

                return res.status(200).send({
                    message: 'User information retrieved successfully',
                    user_information
                });
            })
            .catch((err) => {
                console.error(err);
                return res.status(500).send({ message: 'Error retrieving user information.' });
            });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'An error occurred while retrieving user information.' });
    }
});




module.exports = app;
