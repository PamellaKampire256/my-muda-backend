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

app.put('/users/:user_id', (req, res) => {
    const userId = parseInt(req.params.user_id);
    const updatedUser = req.body;

    // Update user data in personal_information_kyc table
    db.query('UPDATE personal_information_kyc SET ? WHERE user_id = ?', [updatedUser, userId], (err, personalResult) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error updating user' });
        } else {
            // Update user data in company_information_kyc table
            db.query('UPDATE company_information_kyc SET ? WHERE user_id = ?', [updatedUser, userId], (err, companyResult) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Error updating user' });
                } else {
                    // Update user data in user_documents_kyc table
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

app.delete('/users/:user_id', (req, res) => {
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

app.delete('/users', (req, res) => {
    const userIDsToDelete = req.body.user_ids; // Assuming user_ids is an array of user IDs to delete

    if (!userIDsToDelete || userIDsToDelete.length === 0) {
        return res.status(400).json({ error: 'No user IDs provided for deletion' });
    }

    const deletePromises = [];
    const deletedUserInformation = [];

    // Create a promise for each table (personal_information_kyc, company_information_kyc, user_documents_kyc)
    const tables = ['personal_information_kyc', 'company_information_kyc', 'user_documents_kyc'];

    tables.forEach(tableName => {
        deletePromises.push(new Promise((resolve, reject) => {
            const sql = `DELETE FROM ${tableName} WHERE user_id IN (?)`;
            db.query(sql, [userIDsToDelete], (err, result) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }));
    });

    Promise.all(deletePromises)
        .then(results => {
            // Check for results that had no rows affected
            const notFoundResults = results.filter(result => result.affectedRows === 0);

            // Store the user IDs that were not found
            const notFoundUserIDs = [];
            notFoundResults.forEach((result, index) => {
                if (result.affectedRows === 0) {
                    notFoundUserIDs.push(userIDsToDelete[index]);
                }
            });

            // Retrieve and store the deleted user information for the found user IDs
            const selectUserInformationSql = `
                SELECT * FROM personal_information_kyc 
                WHERE user_id IN (?)
                UNION ALL
                SELECT * FROM company_information_kyc 
                WHERE user_id IN (?)
                UNION ALL
                SELECT * FROM user_documents_kyc 
                WHERE user_id IN (?)
            `;

            db.query(selectUserInformationSql, [userIDsToDelete, userIDsToDelete, userIDsToDelete], (err, userInfo) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error retrieving user information' });
                }

                // Send the deleted user information along with IDs and the not found user IDs
                return res.status(200).json({
                    message: 'Selected users deleted successfully',
                    deleted_users: userInfo,
                    not_found_user_ids: notFoundUserIDs,
                });
            });
        })
        .catch(err => {
            return res.status(500).json({ error: 'Error deleting selected users' });
        });
});

module.exports = app;