const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('slugs');

mongoose.Promise = global.Promise; // use the built-in native ES6 Promises

const storeSchema = new Schema({
  name: {
    type: String, // define the type of data we expect for the name
    trim: true, // trim any leading/trailing whitespace
    required: 'Please enter a valid store name', // rather than pass true and get ugly MongoDB error messages, a string here will 1) act a a true boolean and 2) act as the error to display.
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      // location type is an Object
      type: String, // within the Object is a string
      default: 'Point',
    },
    coordinates: [
      {
        type: Number,
        required: 'Please enter valid coordinates',
      },
    ],
    address: {
      type: String,
      required: 'Please enter a valid address',
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author',
  },
});

// set up indexes for fields we want to be able to search on efficiently
storeSchema.index({
  name: 'text', // tell mongodb we want to index as text to make it possible to search within strings
  description: 'text',
});

storeSchema.index({
  location: '2dsphere',
});

// whenever a new store is saved, we auto-generate a slug before the data goes to mongodb
storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip this step
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other stores that may have the same slug
  const slugCheck = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugCheck });
  if (storesWithSlug.length > 0) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
  // TODO: make more resilient so slugs are unique
});

// add a method to our store schema
// must be a function() so we can use the "this" keyword
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' }, // create new entries for each tag a store has
    { $group: { _id: '$tags', count: { $sum: 1 } } }, // create a new group based on the tag field then, in each of those groups, create yet another new field called count
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // 1. Look up store and populate their reviews
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'store',
        as: 'reviews',
      },
    },
    // 2. filter for only items with 2 or more reviews
    {
      $match: {
        'reviews.1': {
          $exists: true,
        },
      },
    },
    // 3. add the average reviews field
    {
      $addFields: {
        averageRating: {
          $avg: '$reviews.rating',
        },
      },
    },
    // 4. sort list by our new average field
    {
      $sort: {
        averageRating: -1,
      },
    },
    // 5. limit to max of 10
    {
      $limit: 10,
    },
  ]);
};

storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link to
  localField: '_id', // which field on our STORE
  foreignField: 'store', // which field on the REVIEW
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);
