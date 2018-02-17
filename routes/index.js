const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

/**
 * GET Routes
 */
router.get('/', catchErrors(storeController.getStores));
router.get('/account', authController.isLoggedIn, userController.account);
router.get('/account/reset/:token', catchErrors(authController.reset));
router.get('/add', authController.isLoggedIn, storeController.addStore);
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getStoresByHeart));
router.get('/login', userController.loginForm);
router.get('/logout', authController.logout);
router.get('/map', storeController.mapPage);
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/stores/', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/tag/:tag', catchErrors(storeController.getStoresByTag));
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/top/', catchErrors(storeController.getTopStores));
router.get('/register', userController.registerForm);

/**
 * POST Routes
 */
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.post('/account/reset/:token', authController.confirmedPasswords, catchErrors(authController.update));
router.post('/add', storeController.upload, catchErrors(storeController.resize), catchErrors(storeController.createStore));
router.post('/add/:id', storeController.upload, catchErrors(storeController.resize), catchErrors(storeController.updateStore));
router.post('/login', authController.login);
router.post('/register', userController.validateRegister, userController.register, authController.login);
router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview));

/**
 * API Routes
 */
router.get('/api/v1/search/:query*?', catchErrors(storeController.searchStores));
router.get('/api/v1/stores', catchErrors(storeController.json));
router.get('/api/v1/stores/near/:lat/:lng', catchErrors(storeController.mapStores));
router.post('/api/v1/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
