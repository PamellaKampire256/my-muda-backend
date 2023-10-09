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
                    resolve(personalResult);
                }
            });
        });

        const companyPromise = new Promise((resolve, reject) => {
            db.query(selectCompanySql, [user_id], (err, companyResult) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(companyResult);
                }
            });
        });

        const userDocumentsPromise = new Promise((resolve, reject) => {
            db.query(selectUserDocumentsSql, [user_id], (err, userDocumentsResult) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(userDocumentsResult);
                }
            });
        });

        Promise.all([personalPromise, companyPromise, userDocumentsPromise])
            .then(([personalResult, companyResult, userDocumentsResult]) => {
                const user_information = {
                    personal_information: personalResult[0] || {},
                    company_information: companyResult[0] || {},
                    user_documents: userDocumentsResult[0] || {}
                };

                if (user_information && 
                    Object.keys(user_information.personal_information).length === 0 &&
                    Object.keys(user_information.company_information).length === 0 &&
                    Object.keys(user_information.user_documents).length === 0) {
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
