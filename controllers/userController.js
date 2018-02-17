const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', {
    title: 'Login'
  });
};

exports.registerForm = (req, res) => {
  res.render('register', {
    title: 'Register'
  });
};

// validation middleware
exports.validateRegister = (req, res, next) => {
  // sanitize name
  req.sanitizeBody('name'); // from expressValidator inport in app.js
  req.checkBody('name', 'Please enter a name!').notEmpty();
  req.checkBody('email', 'Please enter a valid email!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password cannot be blank').notEmpty();
  req.checkBody('password-confirm', 'Confirm Password cannot be blank').notEmpty();
  req.checkBody('password-confirm', 'Passwords must match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
    return; // stop from running if we have errors
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email
  });
  const registerWithPromise = promisify(User.register, User);
  await registerWithPromise(user, req.body.password);
  next();
};

exports.account = (req, res) => {
  res.render('account', {
    title: 'Account'
  });
};

exports.updateAccount = async (req, res, next) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'Account updated! 👍');
  res.redirect('back');
};
