
const books = require('../models/bookModel');
const mongoose = require("mongoose");
const stripe=require('stripe')(process.env.STRIPEKEY)
const { GoogleGenerativeAI } = require("@google/generative-ai");
exports.addBookController = async (req, res) => {
  try {
    console.log("Inside add book controller");

    const {
      title,
      author,
      pages,
      imageUrl,
      price,
      discountPrice,
      abstract,
      publisher,
      isbn,
      language,
      category
    } = req.body;

    // Get uploaded image filenames
    const uploadImages = req.files
      ? req.files.map((file) => file.filename)
      : [];

    // Get seller email from authenticated user
    const sellerEmail = req.payload;

    console.log("Book title:", title);
    console.log("Uploaded images:", uploadImages);
    console.log("Seller email:", sellerEmail);

    // Check required fields
    if (!title || !author || !sellerEmail) {
      return res.status(400).json({
        message: "Title, author and seller email are required."
      });
    }

    // Check duplicate book
    const existingBook = await books.findOne({
      title,
      sellerEmail
    });

    if (existingBook) {
      return res.status(409).json({
        message: "Book already exists. Operation denied."
      });
    }

    // Save book
    const newBook = await books.create({
      title,
      author,
      pages,
      imageUrl,
      price,
      discountPrice,
      abstract,
      publisher,
      isbn,
      language,
      category,
      uploadImages,
      sellerEmail
    });

    return res.status(201).json({
      message: "Book added successfully!",
      book: newBook
    });

  } catch (error) {
    console.error("Add book error:", error);

    return res.status(500).json({
      message: "Failed to add book.",
      error: error.message
    });
  }
};
// Get latest 4 books for Home page
exports.getHomePageBookController = async (req, res) => {
  try {
    console.log("Inside getHomePageBookController");

    const homebooks = await books
      .find()
      .sort({ _id: -1 })
      .limit(4);

    res.status(200).json(homebooks);
  } catch (error) {
    console.error("Get home page books error:", error);

    res.status(500).json({
      message: "Failed to fetch latest books",
      error: error.message,
    });
  }
};
// Get all books uploaded by other users
exports.getAllBooksController = async (req, res) => {
  try {
    const currentUserEmail = req.payload;

    const allBooks = await books
      .find({ sellerEmail: { $ne: currentUserEmail } })
      .sort({ _id: -1 });

    return res.status(200).json(allBooks);
  } catch (error) {
    console.error("Get all books error:", error);

    return res.status(500).json({
      message: "Failed to fetch books",
      error: error.message,
    });
  }
};

exports.getMyBooksController = async (req, res) => {
  try {
    const currentUserEmail = req.payload;

    const myBooks = await books
      .find({ sellerEmail: currentUserEmail })
      .sort({ _id: -1 });

    return res.status(200).json(myBooks);
  } catch (error) {
    console.error('Get my books error:', error);
    return res.status(500).json({
      message: 'Failed to fetch your books',
    });
  }
};
exports.getSingleBookController = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await books.findById(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error("Get single book error:", error);

    return res.status(500).json({
      message: "Failed to fetch book",
       error: error.message
    });
  }
};

exports.removeBookController = async (req, res) => {
  try {
    console.log("Inside removeBookController");

    const { id } = req.params;

    const dltdBook = await books.findByIdAndDelete(id);

    if (!dltdBook) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.status(200).json({
      message: "Book deleted successfully",
      deletedBook: dltdBook,
    });
  } catch (error) {
    console.error("Remove book error:", error);

    return res.status(500).json({
      message: "Failed to delete book",
      error: error.message,
    });
  }
};

exports.bookpaymentController = async (req, res) => {
  try {
    console.log("Inside bookpaymentController");

    const { id } = req.params;
    const loginUserMail = req.payload;

    const bookDetails = await books.findById(id);

    if (!bookDetails) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    const price = Number(
      bookDetails.discountPrice ?? bookDetails.price
    );

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        message: "Invalid book price",
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: bookDetails.title,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],

      mode: "payment",

      metadata: {
        bookId: id,
        buyerEmail: loginUserMail,
      },

      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/fail",
    });

    console.log("Checkout URL:", session.url);

    return res.status(200).json({
      checkoutUrl: session.url,
    });

  } catch (error) {
    console.error("BOOK PAYMENT ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};


exports.verifyPaymentController=async(req,res)=>{
  console.log("inside verifypayemntcontroller");
  const {sessionID}=req.body

  const session = await stripe.checkout.sessions.retrieve(sessionID);
  if(session.payment_status=='paid'){
  const bookId=session.metadata.bookId
  const email=session.metadata.buyerEmail
  const book=await books.findById({_id:bookId})
  book.status='sold'
  book.buyerEmail=email
  await book.save()
  res.status(200).json({message:"Payment completed successfully",book})
   
  }else{
    res.status(400).json({message:"Payment not completed"})
  }
}
// GET ALL BOOKS
// GET ALL BOOKS FOR ADMIN
exports.getAllBooksController = async (req, res) => {
  try {
    console.log("Inside Admin Get All Books Controller");

    // Fetch books uploaded by ALL users
    const allBooks = await books
      .find()
      .sort({ _id: -1 });

    console.log("Total Books:", allBooks.length);

    return res.status(200).json({
      success: true,
      message: "All books fetched successfully",
      books: allBooks,
    });

  } catch (error) {
    console.error("Get all books error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch books",
      error: error.message,
    });
  }
};
// Approve a book

exports.getAllAdminBooksController = async (req, res) => {
  try {
    const allBooks = await books.find().sort({ _id: -1 });

    return res.status(200).json({
      success: true,
      message: "All books fetched successfully",
      books: allBooks,
    });
  } catch (error) {
    console.error("Get admin books error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
};

// ADMIN: Approve a book
exports.approveBookController = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedBook = await books.findByIdAndUpdate(
      id,
      { $set: { status: "Approved" } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book approved successfully",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Approve book error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve book",
      error: error.message,
    });
  }
};

// HOME: Get latest four books
exports.getHomePageBookController = async (req, res) => {
  try {
    const homeBooks = await books
      .find()
      .sort({ _id: -1 })
      .limit(4);

    return res.status(200).json(homeBooks);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch home page books",
    });
  }
};

// USER: Get books uploaded by logged-in user
exports.getMyBooksController = async (req, res) => {
  try {
    const currentUserEmail = req.payload;

    const myBooks = await books
      .find({ sellerEmail: currentUserEmail })
      .sort({ _id: -1 });

    return res.status(200).json(myBooks);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your books",
    });
  }
};
exports.generateBookAbstractController = async (req, res) => {
  console.log("inside generatebookabstractcontroller");
  const genAI = new GoogleGenerativeAi(process.env.GEMINI_API);
  const { title}=req.body
  const model=genAI.getGenerativeModel({model:'gemini-3.5-flash'});
  const result = await model.generateContent('give me a short abstract of the book ${title} as plain text');
  const reply=result.response
res.status(200).json({
  success:true,
  content:reply.candidate[0].content.parts[0].text
})

}