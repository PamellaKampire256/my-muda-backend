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
        cb(null, `${Date.now()}${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

router.post('/upload-files', upload.fields([
    { name: 'national_id_card_or_passport', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
    { name: 'proof_of_address', maxCount: 1 },
    { name: 'trade_licences', maxCount: 1 }
]), (req, res) => {
    try {
        const nationalIDFile = req.files['national_id_card_or_passport'][0];
        const selfieFile = req.files['selfie'][0];
        const proofOfAddressFile = req.files['proof_of_address'][0];
        const tradeLicencesFile = req.files['trade_licences'][0];

    if (!nationalIDFile || !selfieFile || !proofOfAddressFile || !tradeLicencesFile) {
        return res.status(400).send({ message: 'Please upload all required files.' });
    }

    const filePaths = {
        national_id_card_or_passport: nationalIDFile.path,
        selfie: selfieFile.path,
        proof_of_address: proofOfAddressFile.path,
        trade_licences: tradeLicencesFile.path
    };

    const insertSql = `
        INSERT INTO user_documents_kyc
        (national_id_card_or_passport, selfie, proof_of_address, trade_licences)
        VALUES (?, ?, ?, ?)
    `;

    db.query(insertSql, [filePaths.national_id_card_or_passport, filePaths.selfie, filePaths.proof_of_address, filePaths.trade_licences], function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: 'Error inserting file paths into the database.' });
        }

        return res.send({ message: 'File paths are successfully uploaded and stored.', file_paths: filePaths });
    });
} catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'An error occurred during file upload and database insertion.' });
}
});

module.exports = router;


