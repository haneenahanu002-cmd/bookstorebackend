
const express = require('express');
const userController = require('../controller/userController');
const bookController = require('../controller/bookController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');

const multerMiddleware = require('../middlewares/multerMiddleware');

const {
  getHomePageBookController,
  getAllBooksController,
  getMyBooksController,
  removeBookController,
  bookpaymentController,

} = require('../controller/bookController');
const router = express.Router();

// User authentication
router.post('/register', userController.registerContoller);
router.post('/login', userController.loginController);
router.post('/google-login', userController.googleLogin);

// Books
router.get('/home-books', getHomePageBookController);
router.get('/all-books', authMiddleware, getAllBooksController);
router.get('/my-books', authMiddleware, getMyBooksController);
router.get(
  "/single-book/:id",
  bookController.getSingleBookController
);
router.delete("/remove-book/:id", bookController.removeBookController);
router.post(
  '/add-book',
  authMiddleware,
  multerMiddleware.array('uploadImage', 3),
  bookController.addBookController
);

// Edit profile
router.put(
  '/user/edit/:id',
  authMiddleware,
  multerMiddleware.single('picture'),
  userController.userEditController
);
router.get("/make-payment/:id", authMiddleware, bookController.bookpaymentController);
router.post("/verify-payment", authMiddleware, bookController.verifyPaymentController);
router.post('/books-ai',adminAuthMiddleware,bookController.generateBookAbstractController)

//-----------------------------------------------admin----------------------------------------
router.get('/books',adminAuthMiddleware,bookController.getAllBooksController);
router.patch(
  "/books/:id/approve",
  adminAuthMiddleware,
  bookController.approveBookController
);
router.get('/all-users',adminAuthMiddleware,userController.getAllUsersController)

module.exports = router;
