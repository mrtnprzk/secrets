//dotenv
require('dotenv').config(); //must be on top

//express-session + passport = Level5
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

//passport-google-oauth20 + passport-facebook = Level6
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
        password: String,
        name: String,
        googleId: String,
        facebookId: String,
        secret: String
    });

    userSchema.plugin(passportLocalMongoose) //part of passport-google-oauth20
    userSchema.plugin(findOrCreate) //part of mongoose-findorcreate

    //Model
    const User = mongoose.model("User", userSchema);

    passport.use(User.createStrategy());            //part of passport

    passport.serializeUser( function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser( function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    //Google
    passport.use(new GoogleStrategy({               //part of passport
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        // userProfileURL: "http://www.googleleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
        });
    }
    ));

    //Facebook
    passport.use(new FacebookStrategy({
        clientID: process.env.APP_ID,
        clientSecret: process.env.APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id, name: profile.displayName}, function (err, user) {
        return cb(err, user);
        });
    }
    ));

//routes ----------------------------------------------

app.get('/', (req, res) => {
    res.render('home');
});

    //google
    app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
    );

    app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    }   
    ); 

    //facebook
    app.get('/auth/facebook',
    passport.authenticate('facebook'));

    app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/secrets', (req, res) => {
    User.find({'secret': {$ne: null}}, (err, foundUser) =>{
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                res.render('secrets', {usersWithSecrets: foundUser})
            }
        }
    });
});

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login')
    }
});

app.post('/submit', (req, res) => {
    
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err)
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save( () => {
                    res.redirect('/secrets');
                });
            }
        }
    });
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
    });
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