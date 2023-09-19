const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./services/db')

const app = express();
const port = process.env.PORT || 3002;


app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000/',
  methods:['POST','PUT','DELETE','GET']
}
  
));


const userRoutes = require('./routes/userRoutes');
const registerRoutes = require('./routes/registerRoutes');
const authRoutes = require('./model/authRoutes'); 
const personalKyc = require('./kyc/personalKyc');

app.use('/users', userRoutes);
app.use('/register', registerRoutes);
app.use('/auth', authRoutes); 
app.use('/profile', personalKyc);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
