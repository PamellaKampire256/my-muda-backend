const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const db = require('../services/db');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadFolder = './uploads';

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder); 
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

router.post('/upload-files', upload.fields([
    { name: 'national_id_card_or_passport', maxCount: 1 }, 
    { name: 'selfie', maxCount: 1 },     
    { name: 'proof_of_address', maxCount: 1 } 
]), (req, res, next) => {
    const nationalIDFile = req.files['national_id_card_or_passport'][0]; 
    const selfieFile = req.files['selfie'][0];           
    const proofOfAddressFile = req.files['proof_of_address'][0]; 

    if (!nationalIDFile || !selfieFile || !proofOfAddressFile) {
        return res.status(400).send({ message: 'Please upload all required files.' });
    }

    const insertSql = "INSERT INTO `user_documents_kyc`(`national_id_card_or_passport`, `selfie`, `proof_of_address`) VALUES (?, ?, ?)";

    db.query(insertSql, [nationalIDFile.filename, selfieFile.filename, proofOfAddressFile.filename], function (err, result) {
        if (err) {
            return res.status(500).send({ message: 'Error inserting files into the database.' });
        }

        return res.send({ message: 'Files are successfully uploaded and stored.' });
    });
});


module.exports = router;
