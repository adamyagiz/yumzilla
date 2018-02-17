const mongoose = require('mongoose');
const Store = mongoose.model('Store'); // referencing the shema from Store.js
const User = mongoose.model('User');
const multer = require('multer'); // set up express to handle multipart form data
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(), // save original file to memory for resizing
  fileFilter(req, file, next) { // ES6 syntax
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: `${file.mimetype} is not an allowed filetype!` }, false);
    }
  }
};

// Display the home page of the site
exports.homePage = (req, res) => {
  res.render('index', {
    title: 'Hiya!'
  });
};

// Display the Add Store page
exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  });
};

// creating the middleware. can attach to single or multiple input(s)
exports.upload = multer(multerOptions).single('photo');

// resize has the next callback because it's not returning anything. rather it will process some data and then move on to the next finction. this will only run if there is an image being uploaded.
exports.resize = async (req, res, next) => {
  // check for an image to upload
  if (!req.file) {
    next(); // skip resize and move to the next function
    return;
  }
  // create a filename for the processed photo:
  const extension = req.file.mimetype.split('/')[1]; // get file extension based on mimetype (don't trust the user)
  req.body.photo = `${uuid.v4()}.${extension}`; // add unique ID and extension for our filename

  // now resize the photo. jimp.read() takes a file path or a buffer!
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);

  // once we've written the photo to the file system, move to the next() function!
  next();
};

// Accept POST data from the Add Store page and save to mongodb
exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  // response from await (on the save() promise) will be stored in the store variable, giving us immediate access to the slug property.
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

// Get store data from mongodb
exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;
  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Store.count();
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash('info', `Sorry, page ${page} doesn't exist. Sending you to page ${pages} instead. Godspeed.`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render('stores', {
    title: 'Stores',
    count,
    page,
    pages,
    stores
  });
};

exports.json = async (req, res) => {
  const stores = await Store.find();
  res.json(stores);
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own the store in order to edit it.');
  }
};

exports.editStore = async (req, res) => {
  // 1. Find the store with the given ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm the user is the owner of the store
  confirmOwner(store, req.user);
  // 3. Render the edit form so the user can update their info
  res.render('editStore', {
    title: `Edit ${store.name}`,
    store
  });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';
  // 1. Find and update the store
  // findOneAndUpdate(query, data, options)
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store info instead of the old
    runValidators: true // check data against the schema to make sure things are kosher
  }).exec(); // exec() to run the mongo query
  req.flash('success', `Successfully updated ${store.name}. <a href="/store/${store.slug}">View Store →</a>`);
  // 2. Redirect the user to the store page and tell them all is well
  res.redirect(`/stores/${store.id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  // console.log(store);
  if (!store) {
    next();
    return;
  }
  res.render('store', {
    title: store.name,
    store
  });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  // const tags = await Store.getTagsList();
  res.render('tags', {
    title: 'Tags',
    tag,
    tags,
    stores
  });
};

exports.mapPage = (req, res) => {
  res.render('map', {
    title: 'Map'
  });
};

exports.getStoresByHeart = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', {
    title: 'Hearted Stores',
    stores
  });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', {
    title: `Top ${stores.length} Stores`,
    stores
  });
};

/**
 * API functions
 */
exports.searchStores = async (req, res) => {
  if (!req.params.query) {
    res.json({
      status: 400,
      message: 'Empty search query returns empty results.'
    });
    return;
  }
  const stores = await Store
  // first find stores that nmatch...
    .find({
      $text: {
        $search: req.params.query || ''
      }
    }, {
      score: {
        $meta: 'textScore'
      }
    })
    // then sort the results
    .sort({
      score: { $meta: 'textScore' }
    });
  if (!stores.length) {
    res.json({
      status: 400,
      message: 'Got your query. Found no matches.',
      query: `${req.params.query}`
    });
    return;
  } else {
    res.json(stores);
  }
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.params.lng, req.params.lat].map(parseFloat); // mongodb expect lng-lat format as opposed to lat-lng
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const stores = await Store.find(query).select('slug name description photo location').limit(10);
  res.json(stores);
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  // if a user hasn't hearted the store, add it. otherwise, UN-heart it!
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};
