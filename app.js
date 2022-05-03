//express-session + passport = Level5
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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

//part of express-session + passport => MUST be after every require BUT before mongoose.connect
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: true,
//   cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

//mongoose 
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/secretsDB');

    //Schema
    const userSchema = new mongoose.Schema({
        email: String,
        password: String
    });

    userSchema.plugin(passportLocalMongoose) //part of passport-local-mongoose

    //Model
    const User = mongoose.model("User", userSchema);

    passport.use(User.createStrategy());            //part of passport
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

//routes ----------------------------------------------

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login')
    }
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {

    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err)
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    })
    
});

app.post('/login', (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });  
});

//------ ----------------------------------------------

app.listen(port, () => {
    console.log(`Server started on ${port}`);
})