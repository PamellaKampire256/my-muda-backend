const express = require('express');
const app = express();
const db = require('../services/db'); 

app.use(express.json());

app.post('/users', (req, res) => {
    const newUser = req.body;
    
   
    const tableName = req.body.table_name;

    if (tableName === 'personal_information_kyc' || tableName === 'company_information_kyc' || tableName === 'user_documents_kyc') {
        db.query(`INSERT INTO ${tableName} SET ?`, newUser, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Error creating user' });
            } else {
                newUser.id = result.insertId;
                res.status(201).json({ message: 'User created successfully', user: newUser });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid table_name specified' });
    }
});


app.get('/users', (req, res) => {
    const users = [];


    function getPersonalUsers(callback) {
        db.query('SELECT * FROM personal_information_kyc', (err, rows) => {
            if (!err) {
                users.push(...rows.map(row => ({ table: 'personal_information_kyc', user: row })));
            }
            callback(err);
        });
    }

    function getCompanyUsers(callback) {
        db.query('SELECT * FROM company_information_kyc', (err, rows) => {
            if (!err) {
                users.push(...rows.map(row => ({ table: 'company_information_kyc', user: row })));
            }
            callback(err);
        });
    }

    function getUserDocumentsUsers(callback) {
        db.query('SELECT * FROM user_documents_kyc', (err, rows) => {
            if (!err) {
                users.push(...rows.map(row => ({ table: 'user_documents_kyc', user: row })));
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
            res.status(200).json(users);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error retrieving users' });
        });
});


app.get('/users/:user_id', (req, res) => {
    const userId = parseInt(req.params.id);
    
    const tableName = req.query.table_name;

    if (tableName === 'personal_information_kyc' || tableName === 'company_information_kyc' || tableName === 'user_documents_kyc') {
        db.query(`SELECT * FROM ${tableName} WHERE user_id = ?`, userId, (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Error retrieving user' });
            } else if (rows.length === 0) {
                res.status(404).json({ error: 'User not found' });
            } else {
                res.status(200).json({ message: 'User retrieved successfully', user: rows[0] });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid table_name specified' });
    }
});

app.put('/users/:user_id', (req, res) => {
    const userId = parseInt(req.params.id);
    const updatedUser = req.body;

    const tableName = req.body.table_name;

    if (tableName === 'personal_information_kyc' || tableName === 'company_information_kyc' || tableName === 'user_documents_kyc') {
        db.query(`UPDATE ${tableName} SET ? WHERE user_id = ?`, [updatedUser, userId], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Error updating user' });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ error: 'User not found' });
            } else {
                res.status(200).json({ message: 'User updated successfully', user: updatedUser });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid table_name specified' });
    }
});

app.delete('/users/:user_id', (req, res) => {
    const userId = parseInt(req.params.id);
    
    const tableName = req.query.table_name;

    if (tableName === 'personal_information_kyc' || tableName === 'company_information_kyc' || tableName === 'user_documents_kyc') {
        db.query(`DELETE FROM ${tableName} WHERE user_id = ?`, userId, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Error deleting user' });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ error: 'User not found' });
            } else {
                res.status(200).json({ message: 'User deleted successfully' });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid table_name specified' });
    }
});


app.delete('/users', (req, res) => {
    const tableName = req.query.table_name;

    if (tableName === 'personal_information_kyc' || tableName === 'company_information_kyc' || tableName === 'user_documents_kyc') {
        db.query(`DELETE FROM ${tableName}`, (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Error deleting all users' });
            } else {
                res.status(200).json({ message: 'All users deleted successfully' });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid table_name specified' });
    }
});

module.exports = app;

