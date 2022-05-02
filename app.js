//dotenv
require('dotenv').config(); //must be on top

//express
const express = require('express');
const app = express();
const port = 3000;
app.use(express.static('public')); //css

//body-parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); 

//ejs
const ejs = require('ejs');
app.set('view engine', 'ejs'); //views

//mongoose + encryption
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/secretsDB');
const encrypt = require('mongoose-encryption');

    //Schema
    const userSchema = new mongoose.Schema({
        email: String,
        password: String
    });

    //Encryption Secret = this MUST be before Model
    userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

    //Model
    const User = mongoose.model("User", userSchema);


//routes ----------------------------------------------

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save((err) => {
        if (err) {
            console.log(err);
        } else {
            res.render('secrets'); //we dont have route for secrets because secrets is just for registered people
        }
    });
});

app.post('/login', (req, res) => {

    
    const username = req.body.username;
    const password = req.body.password;
    
    User.findOne({email: username}, (err, foundUser) => {
        if (err) {
            console.log(err)
        } else {
            if (foundUser) {
                if (foundUser.password === password) { 
                    res.render('secrets'); //we dont have route for secrets because secrets is just for registered people
                }
            }
        }
    })
});

//------ ----------------------------------------------

app.listen(port, () => {
    console.log(`Server started on ${port}`);
})