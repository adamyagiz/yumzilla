const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const sendMail = require('../handlers/mailHandler');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Login failed!',
    successRedirect: '/',
    successFlash: 'Successfully logged in',
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Successfully logged out! 👋');
    res.redirect('/');
};

// middleware to check if a user is logged in and can add a store
exports.isLoggedIn = (req, res, next) => {
    // check if a user has been authenticated
    if (req.isAuthenticated()) {
        next();
        return;
    }
    req.flash('error', 'You must be logged in to do that!');
    res.redirect('/login');
};

exports.forgot = async (req, res) => {
    // 1. Check if a user exists with the supplied email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        req.flash('error', 'Could not find an account with that email. <a href="/register">Click here to sign up.</a>');
        return res.redirect('/login');
    }
    // 2. Create reset/expiry tokens on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpiry = Date.now() + 3600000; // 1 hour from time of triggering
    await user.save();
    // 3. Send an email with the token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await sendMail.send({
        user,
        resetURL,
        filename: 'password-reset', // for the email pug template
        subject: 'Your password reset link',
    });
    req.flash('success', 'You have been emailed a password reset link.');
    // 4. Redirect to the login page
    return res.redirect('/login');
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        res.redirect('/login');
    }
    // If there is a user, show the reset pasword form
    res.render('reset', {
        title: 'Reset Your Password',
    });
};

exports.confirmedPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Passwords do not match');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'Password has been successfully reset! 💃');
    res.redirect('/');
};
