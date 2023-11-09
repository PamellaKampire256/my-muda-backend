const express = require('express');
const app = express();
const db = require('../services/db'); 

app.use(express.json());

app.get('/users', (req, res) => {
    const users = {};

    function getPersonalUsers(callback) {
        db.query('SELECT * FROM personal_information_kyc', (err, rows) => {
            if (!err) {
                rows.forEach(row => {
                    const userId = row.user_id;
                    if (!users[userId]) {
                        users[userId] = {};
                    }
                    users[userId] = { ...users[userId], ...row };
                });
            }
            callback(err);
        });
    }

    function getCompanyUsers(callback) {
        db.query('SELECT * FROM company_information_kyc', (err, rows) => {
            if (!err) {
                rows.forEach(row => {
                    const userId = row.user_id;
                    if (!users[userId]) {
                        users[userId] = {};
                    }
                    users[userId] = { ...users[userId], ...row };
                });
            }
            callback(err);
        });
    }

    function getUserDocumentsUsers(callback) {
        db.query('SELECT * FROM user_documents_kyc', (err, rows) => {
            if (!err) {
                rows.forEach(row => {
                    const userId = row.user_id;
                    if (!users[userId]) {
                        users[userId] = {};
                    }
                    users[userId] = { ...users[userId], ...row };
                });
            }
            callback(err);
        });
    }

    Promise.all([
        new Promise(getPersonalUsers),
        new Promise(getCompanyUsers),
        new Promise(getUserDocumentsUsers)
    ])
        .then(() => {
            res.status(200).json({ message: 'User information retrieved successfully', users });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error retrieving users' });
        });
});

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

                // Assuming that user_documents_kyc has fields like 'national_id_or_passport', 'selfie', etc.
                // Convert images to base64 before sending
                const imageFields = ['national_id_card_or_passport', 'selfie', 'proof_of_address', 'trade_licences'];
                imageFields.forEach((field) => {
                    if (user_information[field]) {
                        user_information[field] = Buffer.from(user_information[field]).toString('base64');
                    }
                });

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

app.put('/update_user/:user_id', (req, res) => {
    const userId = parseInt(req.params.user_id);
    const updatedUser = req.body;

    db.query('UPDATE personal_information_kyc SET ? WHERE user_id = ?', [updatedUser, userId], (err, personalResult) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error updating user' });
        } else {
            db.query('UPDATE company_information_kyc SET ? WHERE user_id = ?', [updatedUser, userId], (err, companyResult) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Error updating user' });
                } else {
                    db.query('UPDATE user_documents_kyc SET ? WHERE user_id = ?', [updatedUser, userId], (err, userDocumentsResult) => {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ error: 'Error updating user' });
                        } else {
                            res.status(200).json({ message: 'User updated successfully', user: updatedUser });
                        }
                    });
                }
            });
        }
    });
});

app.delete('/user/:user_id', (req, res) => {
    const userId = parseInt(req.params.user_id);

    // Delete user data from personal_information_kyc table
    db.query('DELETE FROM personal_information_kyc WHERE user_id = ?', userId, (err, personalResult) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error deleting user' });
        } else {
            // Delete user data from company_information_kyc table
            db.query('DELETE FROM company_information_kyc WHERE user_id = ?', userId, (err, companyResult) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Error deleting user' });
                } else {
                    // Delete user data from user_documents_kyc table
                    db.query('DELETE FROM user_documents_kyc WHERE user_id = ?', userId, (err, userDocumentsResult) => {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ error: 'Error deleting user' });
                        } else {
                            res.status(200).json({ message: 'User deleted successfully' });
                        }
                    });
                }
            });
        }
    });
});

module.exports = app;