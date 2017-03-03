var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

var multer  = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/Uploads/');
  },
  filename: function (req, file, callback) {
  	console.log(file.originalname);
  	var srclink = file.originalname;
		var name = req.body.photoname;
    callback(null, srclink);
    //console.log(req.body.photoName);

		User.update({_id:req.user.id}, {$push:{photos:{name: name, src: srclink}}}, function(err, res) {
			if(err)
				console.log(err);
		});
  }
});
var upload = multer({ storage : storage}).single('uploaded');

// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register User
router.post('/register', function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors:errors
		});
	} else {
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password,
			photos: [],
      links: []
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}
});

passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login',failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });

router.get('/profile',ensureAuthenticated, function(req, res) {

	res.render('profile');
});

router.post('/addFile', function(req, res) {

    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading.\n"+err);
        }
        res.redirect('/users/profile');
    });

});

router.post('/addLink', function(req, res) {
    var linkN = req.body.linkName;
    var linkS = req.body.linksrc;
    console.log(req.body.linkName);
    console.log(linkS);
    console.log("A");
      User.update({_id:req.user.id}, {$push:{links:{name: linkN, link: linkS}}}, function(err, res) {
        if(err)
          console.log(err);
      });


        res.redirect('/users/profile');
    });





router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'logged out');

	res.redirect('/users/login');
});


function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;
