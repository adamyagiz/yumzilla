const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise; // use the built-in native ES6 Promises
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [
      validator.isEmail,
      'Invalid Email Address'
    ],
    required: 'Please enter an email address.'
  },
  name: {
    type: String,
    required: 'Please enter a name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  hearts: [ // hearts will be an array of store IDs
    {
      type: mongoose.Schema.ObjectId, // id of the hearted store
      ref: 'Store' // ref the Store schema
    }
  ]
});

userSchema.virtual('gravatar').get(function() {
  const emailHash = md5(this.email);
  return `https://gravatar.com/avatar/${emailHash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
