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

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://your-frontend-domain.com'  // Add your deployed frontend domain
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware before other middlewares
app.use(cors(corsOptions));

// Other middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add headers middleware for additional CORS handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      body: "OK"
    });
  }
  
  next();
});

// Basic route for testing
app.get('/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

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

    // Generate token using MongoDB _id
    const token = jwt.sign(
      { userId: user._id }, // Use MongoDB _id instead of UUID
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
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
    const books = await Book.find()
      .select('_id title author description imageUrl category rentPrice quantity available averageRating totalRentals feedback')
      .populate('feedback.user', 'name')
      .lean();

    console.log('Fetched books:', books.length);

    const formattedBooks = books.map(book => ({
      _id: book._id,
      title: book.title,
      author: book.author,
      description: book.description,
      imageUrl: book.imageUrl || '/images/default-book.jpg',
      category: book.category,
      rentPrice: book.rentPrice || 0,
      quantity: book.quantity || 0,
      available: book.quantity > 0,
      averageRating: book.averageRating || 0,
      totalRentals: book.totalRentals || 0,
      feedback: book.feedback || []
    }));

    res.json({
      success: true,
      books: formattedBooks
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching books',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ message: "Error fetching book" });
  }
});

// Cart Routes
app.post("/api/cart/add", auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
    }

    console.log('Adding to cart:', { 
      bookId, 
      userId: req.user._id,
      body: req.body 
    });
    
    if (!bookId) {
      return res.status(400).json({ 
        success: false,
        message: 'Book ID is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid book ID format' 
      });
    }

    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found' 
      });
    }

    // Find or create cart using MongoDB _id
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart with proper user reference
      cart = new Cart({
        user: req.user._id,
        items: [],
        totalAmount: 0
      });
    }

    // Check if book already in cart
    const existingItem = cart.items.find(item => 
      item.book.toString() === bookId
    );

    if (existingItem) {
      return res.status(400).json({ 
        success: false,
        message: 'Book already exists in cart' 
      });
    }

    // Add new item
    cart.items.push({
      book: bookId,
      quantity: 1,
      rentalDuration: 1
    });

    // Calculate total
    cart.totalAmount = cart.items.reduce((total, item) => {
      return total + (book.rentPrice * item.rentalDuration);
    }, 0);

    // Save cart
    await cart.save();

    // Populate book details
    await cart.populate('items.book');

    res.json({ 
      success: true,
      message: 'Book added to cart successfully',
      cart 
    });

  } catch (error) {
    console.error('Cart add error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      bookId: req.body?.bookId
    });
    res.status(500).json({ 
      success: false,
      message: 'Error adding book to cart',
      error: error.message 
    });
  }
});

app.get("/api/cart", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.mongoId }).populate('items.book');
    
    if (!cart) {
      return res.json({ 
        success: true,
        cart: { items: [], totalAmount: 0 } 
      });
    }

    res.json({ 
      success: true,
      cart 
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching cart' 
    });
  }
});

// Update cart item
app.put("/api/cart/update/:bookId", auth, async (req, res) => {
  try {
    const { rentalDuration } = req.body;
    const { bookId } = req.params;

    // Find cart using mongoId
    const cart = await Cart.findOne({ user: req.user.mongoId });

    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    // Find the book to get its price
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found' 
      });
    }

    // Find and update the cart item
    const cartItem = cart.items.find(item => 
      item.book.toString() === bookId
    );

    if (!cartItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found in cart' 
      });
    }

    cartItem.rentalDuration = rentalDuration;
    
    // Recalculate total amount
    cart.totalAmount = cart.items.reduce((total, item) => {
      return total + (book.rentPrice * item.rentalDuration);
    }, 0);

    await cart.save();
    await cart.populate('items.book');

    res.json({ 
      success: true,
      message: 'Cart updated successfully',
      cart 
    });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating cart',
      error: error.message 
    });
  }
});

// Remove item from cart
app.delete("/api/cart/remove/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;

    // Find cart using mongoId
    const cart = await Cart.findOne({ user: req.user.mongoId });
    
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    // Remove the item
    cart.items = cart.items.filter(item => 
      item.book.toString() !== bookId
    );

    // Recalculate total amount
    const book = await Book.findById(bookId);
    if (book) {
      cart.totalAmount = cart.items.reduce((total, item) => {
        return total + (book.rentPrice * item.rentalDuration);
      }, 0);
    }

    await cart.save();
    await cart.populate('items.book');

    res.json({ 
      success: true,
      message: 'Book removed from cart',
      cart 
    });
  } catch (error) {
    console.error('Cart remove error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error removing book from cart',
      error: error.message 
    });
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
    await Cart.findOneAndDelete({ user: req.user.mongoId });

    res.json({ 
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: "Error updating profile",
      error: error.message 
    });
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
    session = await mongoose.startSession();
    session.startTransaction();

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.bookId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((total, item) => {
      return total + (item.bookId.rentPrice * item.rentalDuration);
    }, 0);

    // Create payment record
    const payment = new Payment({
      userId: req.user.id,
      items: cart.items.map(item => ({
        bookId: item.bookId.id,
        rentalDuration: item.rentalDuration,
        priceAtPurchase: item.bookId.rentPrice
      })),
      totalAmount,
      status: 'completed',
      paymentMethod: 'direct'
    });

    await payment.save({ session });

    // Update user's rented books
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      throw new Error('User not found');
    }

    // Add books to user's rentedBooks
    const currentDate = new Date();
    const rentedBooks = cart.items.map(item => ({
      bookId: item.bookId.id,
      rentedDate: currentDate,
      returnDate: new Date(currentDate.getTime() + (item.rentalDuration * 24 * 60 * 60 * 1000)),
      status: 'active'
    }));

    user.rentedBooks.push(...rentedBooks);
    await user.save({ session });

    // Update book quantities
    for (const item of cart.items) {
      await Book.findOneAndUpdate(
        { id: item.bookId.id },
        { $inc: { quantity: -1 } },
        { session }
      );
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ userId: req.user.id }, { session });

    await session.commitTransaction();
    
    res.status(201).json({ 
      message: "Payment processed successfully",
      paymentId: payment._id,
      totalAmount,
      rentedBooks
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    console.error("Payment Processing Error:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: "Error processing payment",
      error: error.message 
    });
  } finally {
    if (session) {
      session.endSession();
    }
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

app.post("/api/payments/process", auth, async (req, res) => {
  try {
    const { name, cardNumber, expiryDate } = req.body;

    // Store payment details in local storage
    const paymentDetails = { name, cardNumber, expiryDate };
    localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));

    res.json({ message: "Payment details saved successfully" });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Error processing payment" });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });

  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : undefined
  });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});