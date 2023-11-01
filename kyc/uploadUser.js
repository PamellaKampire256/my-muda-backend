const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const db = require('../services/db');

const uploadFolder = './uploads';

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

router.post('/upload-files', upload.any(), async (req, res) => {
    try {
        const { user_id } = req.body;
        const status = 'pending'; 

        if (!req.files || req.files.length === 0) {
            return res.status(400).send({ message: 'No files were uploaded.' });
        }

        const files = req.files;
        const filePaths = {
            national_id_card_or_passport: null,
            selfie: null,
            proof_of_address: null,
            trade_licences: null
        };

        files.forEach(file => {
            if (file.fieldname in filePaths) {
                filePaths[file.fieldname] = file.path;
            }
        });

        const insertSql = `
            INSERT INTO user_documents_kyc
            (user_id, national_id_card_or_passport, selfie, proof_of_address, trade_licences, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            user_id,
            filePaths.national_id_card_or_passport,
            filePaths.selfie,
            filePaths.proof_of_address,
            filePaths.trade_licences,
            status
        ];

        const result = await db.query(insertSql, values);

        if (result) {
            return res.send({ message: 'File paths are successfully uploaded and stored.', file_paths: filePaths, user_id, status });
        } else {
            return res.status(500).send({ message: 'Error inserting file paths into the database.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'An error occurred during file upload and database insertion.' });
    }
});

module.exports = router;
