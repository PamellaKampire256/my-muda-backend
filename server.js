const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./services/db')

const app = express();
const port = process.env.PORT || 3002;


app.use(bodyParser.json());
app.use(express.json());
app.use(
  cors({
  origin: '*',
  methods:['POST','PUT','DELETE','GET']
})
);


const userRoutes = require('./routes/userRoutes');
const registerRoutes = require('./routes/registerRoutes');
const authRoutes = require('./model/authRoutes'); 
const personalKyc = require('./kyc/personalKyc');
const uploadUser = require('./kyc/uploadUser');
const userID = require('./model/userID');

app.use('/users', userRoutes);
app.use('/register', registerRoutes);
app.use('/auth', authRoutes); 
app.use('/profile', personalKyc);
app.use('/upload', uploadUser);
app.use('/user', userID);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
