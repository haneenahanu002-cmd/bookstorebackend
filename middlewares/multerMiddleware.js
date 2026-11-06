
const multer = require('multer');

// Define storage space for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads');
    },

    filename: (req, file, callback) => {
        callback(null, `Image-${file.originalname}-${Date.now()}`);
    }
});

// Allow only image files
const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
        callback(null, true);
    } else {
        callback(new Error('Only image files are allowed!'));
    }
};

const multerMiddleware = multer({
    storage,
    fileFilter
});

module.exports = multerMiddleware;
