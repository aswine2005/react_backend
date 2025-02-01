const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const auth = require("./middlewares/auth");
const User = require("./models/user");
const Book = require("./models/book");
const Payment = require("./models/payment");
const Cart = require("./models/cart");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5176',
    'https://react-backend-gc4j.onrender.com'
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Use cors middleware with proper configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5176',
      'https://react-backend-gc4j.onrender.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// MongoDB Atlas Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB Atlas successfully!");
  } catch (error) {
    console.error("MongoDB Atlas connection error:", error);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// Handle connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB Atlas connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB Atlas disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB Atlas reconnected successfully!");
});

// Authentication Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, phoneNo } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      id: uuidv4(),
      name,
      email,
      password,
      phoneNo,
      cart: [],
      rentedBooks: []
    });

    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo
      },
      token
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Protected route example
app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNo: user.phoneNo,
      cart: user.cart,
      rentedBooks: user.rentedBooks
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Books Routes
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find({});
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Error fetching books" });
  }
});

app.post("/api/books", auth, async (req, res) => {
  const { title, author, description, quantity, rentPrice } = req.body;
  try {
    const newBook = new Book({
      id: uuidv4(),
      title,
      author,
      description,
      quantity,
      available: quantity > 0,
      rentPrice
    });

    const savedBook = await newBook.save();
    res.status(201).json({ message: "Book added successfully", book: savedBook });
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(500).json({ message: "Error adding book" });
  }
});

app.get("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findOne({ id });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({ message: "Error fetching book" });
  }
});

// Cart Routes
app.get("/api/cart", auth, async (req, res) => {
  try {
    console.log('Fetching cart for user:', req.user.id);
    
    const cart = await Cart.findOne({ userId: req.user.id }).populate({
      path: 'items.book',
      select: 'title author rentPrice imageUrl available quantity'
    });

    if (!cart) {
      console.log('No cart found for user, creating new cart');
      return res.status(200).json({ 
        items: [],
        message: 'Cart is empty' 
      });
    }

    // Validate and filter cart items
    const validItems = cart.items.filter(item => 
      item.book && item.book.available && item.book.quantity > 0
    ).map(item => ({
      bookId: item.book.id,
      title: item.book.title,
      author: item.book.author,
      rentPrice: item.book.rentPrice,
      imageUrl: item.book.imageUrl,
      rentalDuration: item.rentalDuration || 1
    }));

    console.log('Cart items found:', {
      userId: req.user.id,
      itemCount: validItems.length
    });

    res.status(200).json({ 
      items: validItems 
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ 
      message: 'Error retrieving cart', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

app.post("/api/cart/add", auth, async (req, res) => {
  try {
    const { bookId, rentalDuration = 1 } = req.body;
    
    // Validate book exists and is available
    const book = await Book.findOne({ id: bookId });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.available || book.quantity <= 0) {
      return res.status(400).json({ message: "Book is not available" });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Check if book already in cart
    const existingItem = cart.items.find(item => item.bookId === bookId);
    if (existingItem) {
      return res.status(400).json({ message: "Book already in cart" });
    }

    // Add book to cart with validated rental duration
    cart.items.push({ 
      bookId, 
      rentalDuration: Math.max(1, Math.min(30, rentalDuration)) // Limit duration between 1 and 30 days
    });
    
    await cart.save();

    // Return updated cart with book details
    const updatedCart = await Cart.findOne({ userId: req.user.id });
    const cartItemsWithDetails = await Promise.all(
      updatedCart.items.map(async (item) => {
        const bookDetails = await Book.findOne({ id: item.bookId });
        return {
          bookId: bookDetails.id,
          title: bookDetails.title,
          author: bookDetails.author,
          imageUrl: bookDetails.imageUrl,
          rentPrice: bookDetails.rentPrice || 0,
          rentalDuration: item.rentalDuration,
          available: bookDetails.available && bookDetails.quantity > 0
        };
      })
    );

    res.status(201).json({ 
      message: "Book added to cart",
      items: cartItemsWithDetails
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

app.put("/api/cart/update/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { rentalDuration } = req.body;

    // Validate rental duration
    if (!rentalDuration || rentalDuration < 1) {
      return res.status(400).json({ message: "Invalid rental duration" });
    }

    // Find cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item in cart
    const cartItem = cart.items.find(item => item.bookId === bookId);
    if (!cartItem) {
      return res.status(404).json({ message: "Book not found in cart" });
    }

    // Update rental duration
    cartItem.rentalDuration = rentalDuration;
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Cart updated", cart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Error updating cart" });
  }
});

app.delete("/api/cart/remove/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove item from cart
    cart.items = cart.items.filter(item => item.bookId !== bookId);
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Book removed from cart", cart });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Error removing from cart" });
  }
});

// Profile Update Route
app.put("/api/users/profile/update", auth, async (req, res) => {
  try {
    const { rentedBooks } = req.body;
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add new rentals to user's rented books
    user.rentedBooks = [
      ...user.rentedBooks,
      ...rentedBooks
    ];

    await user.save();

    // Clear user's cart after successful rental
    await Cart.findOneAndDelete({ userId: req.user.id });

    res.json({ 
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        rentedBooks: user.rentedBooks
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Rent Operations
app.post("/api/rent", auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findOne({ id: bookId });
    const user = await User.findOne({ id: req.user.id });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.available || book.quantity <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    // Update book quantity and availability
    book.quantity -= 1;
    book.available = book.quantity > 0;
    await book.save();

    // Update user's rented books
    user.rentedBooks.push(bookId);
    user.cart = user.cart.filter(id => id !== bookId);
    await user.save();

    res.json({ 
      message: "Book rented successfully",
      rentedBooks: user.rentedBooks,
      cart: user.cart
    });
  } catch (error) {
    console.error("Error renting book:", error);
    res.status(500).json({ message: "Error renting book" });
  }
});

// Feedback
app.post("/api/books/:bookId/feedback", auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { rating, comment } = req.body;
    const book = await Book.findOne({ id: bookId });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.feedback.push({
      userId: req.user.id,
      rating,
      comment
    });

    await book.save();
    res.json({ message: "Feedback submitted successfully", book });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Error submitting feedback" });
  }
});

app.get("/api/books/:bookId/feedback", async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findOne({ id: bookId });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book.feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Error fetching feedback" });
  }
});

// Payment Routes
app.post("/api/payments/create", auth, async (req, res) => {
  let session;
  try {
    // Start a mongoose session for transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Log entire request body for debugging
    console.log('Full Payment Creation Request:', {
      userId: req.user.id,
      body: req.body,
      headers: req.headers
    });

    const { items, totalAmount } = req.body;

    // Validate request body structure
    if (!items || !Array.isArray(items)) {
      console.error('Invalid items format:', items);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: "Invalid items format", 
        details: "Items must be an array" 
      });
    }

    if (items.length === 0) {
      console.error('No items provided');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: "No items provided", 
        details: "Cart cannot be empty" 
      });
    }

    // Validate total amount
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      console.error('Invalid total amount:', totalAmount);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: "Invalid total amount", 
        details: "Total amount must be a positive number" 
      });
    }

    // Detailed validation for each item
    const itemValidationErrors = [];
    const validatedItems = await Promise.all(
      items.map(async (item, index) => {
        // Validate item structure
        if (!item.bookId || !item.rentPrice || !item.rentalDuration) {
          itemValidationErrors.push(`Item at index ${index} is missing required fields`);
          return null;
        }

        try {
          // Find book and validate
          const book = await Book.findOne({ id: item.bookId });
          
          if (!book) {
            itemValidationErrors.push(`Book ${item.bookId} not found`);
            return null;
          }

          // Validate book availability
          if (!book.available || book.quantity <= 0) {
            itemValidationErrors.push(`Book ${item.bookId} is not available`);
            return null;
          }

          // Validate price
          if (Math.abs(book.rentPrice - item.rentPrice) > 0.01) {
            itemValidationErrors.push(`Price mismatch for book ${item.bookId}. Expected: ${book.rentPrice}, Got: ${item.rentPrice}`);
            return null;
          }

          return { 
            book, 
            item: {
              bookId: item.bookId,
              rentalDuration: item.rentalDuration,
              rentPrice: item.rentPrice
            }
          };
        } catch (error) {
          console.error(`Error validating book ${item.bookId}:`, error);
          itemValidationErrors.push(`Validation error for book ${item.bookId}: ${error.message}`);
          return null;
        }
      })
    );

    // Check for validation errors
    if (itemValidationErrors.length > 0) {
      console.error('Item validation errors:', itemValidationErrors);
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: "Item validation failed", 
        details: itemValidationErrors 
      });
    }

    // Calculate total from validated items
    const calculatedTotal = validatedItems.reduce((total, validItem) => {
      return total + (validItem.item.rentPrice * validItem.item.rentalDuration);
    }, 0);

    // Verify total amount
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      console.error('Total amount mismatch', {
        calculated: calculatedTotal,
        provided: totalAmount
      });
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: "Total amount mismatch", 
        details: {
          calculated: calculatedTotal,
          provided: totalAmount
        }
      });
    }

    // Create payment record
    const payment = new Payment({
      userId: req.user.id,
      items: validatedItems.map(validItem => validItem.item),
      totalAmount,
      status: 'pending',
      createdAt: new Date()
    });

    // Save payment
    await payment.save({ session });

    // Update book quantities
    await Promise.all(
      validatedItems.map(async (validItem) => {
        const book = await Book.findOne({ id: validItem.item.bookId });
        book.quantity -= 1;
        book.available = book.quantity > 0;
        await book.save({ session });
      })
    );

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: req.user.id }, 
      { items: [] }, 
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Return success response
    res.status(201).json({ 
      message: "Payment created successfully",
      paymentId: payment._id,
      totalAmount: payment.totalAmount
    });

  } catch (error) {
    // Log full error details
    console.error("Comprehensive Payment Creation Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : null
    });

    // Attempt to abort transaction if it exists
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (sessionError) {
        console.error('Error aborting transaction:', sessionError);
      }
    }

    // Detailed error response
    res.status(500).json({ 
      message: "Internal server error during payment creation",
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        details: error.errors ? Object.values(error.errors).map(err => err.message) : null
      } : undefined
    });
  }
});

app.get("/api/payments/:paymentId", auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ _id: paymentId, userId: req.user.id });
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Error fetching payment" });
  }
});

app.post("/api/payments/:paymentId/process", auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { cardDetails } = req.body;

    const payment = await Payment.findOne({ _id: paymentId, userId: req.user.id });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: "Payment already processed" });
    }

    // Process payment and update user's rented books
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add books to user's rentedBooks
    const rentedBooks = payment.items.map(item => ({
      bookId: item.bookId,
      rentalDuration: item.rentalDuration,
      rentStartDate: new Date(),
      rentEndDate: new Date(Date.now() + item.rentalDuration * 24 * 60 * 60 * 1000)
    }));

    user.rentedBooks.push(...rentedBooks);
    await user.save();

    // Update payment status
    payment.status = 'completed';
    payment.processedAt = new Date();
    await payment.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { items: [] } }
    );

    res.json({ message: "Payment processed successfully", payment });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Error processing payment" });
  }
});

// Get Payment Details Route
app.get("/api/payments/:paymentId", auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      _id: req.params.paymentId, 
      userId: req.user.id 
    }).populate({
      path: 'items.book',
      select: 'title author imageUrl'
    });

    if (!payment) {
      return res.status(404).json({ 
        message: 'Payment not found' 
      });
    }

    // Format payment details for frontend
    const paymentDetails = {
      _id: payment._id,
      totalAmount: payment.totalAmount,
      status: payment.status,
      createdAt: payment.createdAt,
      items: payment.items.map(item => ({
        bookId: item.book._id,
        title: item.book.title,
        author: item.book.author,
        imageUrl: item.book.imageUrl,
        rentPrice: item.rentPrice,
        rentalDuration: item.rentalDuration
      }))
    };

    res.status(200).json(paymentDetails);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ 
      message: 'Error retrieving payment details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate Payment Receipt Route
app.get("/api/payments/:paymentId/receipt", auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ 
      _id: req.params.paymentId, 
      userId: req.user.id 
    }).populate({
      path: 'items.book',
      select: 'title author'
    });

    if (!payment) {
      return res.status(404).json({ 
        message: 'Payment not found' 
      });
    }

    // Use a PDF generation library like PDFKit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payment_receipt_${payment._id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // PDF Content
    doc.fontSize(25).text('Book Rental Receipt', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12)
       .text(`Payment ID: ${payment._id}`)
       .text(`Date: ${payment.createdAt.toLocaleString()}`)
       .text(`Total Amount: ₹${payment.totalAmount.toFixed(2)}`)
       .text(`Status: ${payment.status}`);

    doc.moveDown();
    doc.fontSize(15).text('Rented Books', { underline: true });

    payment.items.forEach((item, index) => {
      doc.fontSize(12)
         .text(`${index + 1}. ${item.book.title} by ${item.book.author}`)
         .text(`   Rental Duration: ${item.rentalDuration} days`)
         .text(`   Price: ₹${(item.rentPrice * item.rentalDuration).toFixed(2)}`);
    });

    doc.end();
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    res.status(500).json({ 
      message: 'Error generating receipt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});