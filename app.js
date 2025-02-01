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
    // Find cart for user
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || !cart.items.length) {
      return res.json({ items: [] });
    }

    // Get book details for each cart item
    const cartItemsWithDetails = await Promise.all(
      cart.items.map(async (item) => {
        const book = await Book.findOne({ id: item.bookId });
        if (!book) {
          return null;
        }
        return {
          bookId: item.bookId,
          title: book.title,
          author: book.author,
          imageUrl: book.imageUrl,
          rentPrice: book.rentPrice || 0,
          rentalDuration: item.rentalDuration || 1,
          available: book.available && book.quantity > 0
        };
      })
    );

    // Filter out any null items (books that weren't found)
    const validItems = cartItemsWithDetails.filter(item => item !== null);

    res.json({ items: validItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Error fetching cart" });
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
  try {
    const { items, totalAmount } = req.body;
    console.log('Payment creation request:', {
      userId: req.user.id,
      items,
      totalAmount
    });

    // Input validation
    if (!items || !Array.isArray(items)) {
      console.log('Invalid items format:', items);
      return res.status(400).json({ message: "Invalid items format" });
    }

    if (items.length === 0) {
      console.log('No items provided');
      return res.status(400).json({ message: "No items provided" });
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      console.log('Invalid total amount:', totalAmount);
      return res.status(400).json({ message: "Invalid total amount" });
    }

    // Log each item for debugging
    items.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        bookId: item.bookId,
        rentalDuration: item.rentalDuration,
        rentPrice: item.rentPrice
      });
    });

    // Calculate expected total
    const calculatedTotal = items.reduce((total, item) => {
      const itemTotal = item.rentPrice * item.rentalDuration;
      console.log(`Item total for ${item.bookId}:`, {
        rentPrice: item.rentPrice,
        duration: item.rentalDuration,
        itemTotal
      });
      return total + itemTotal;
    }, 0);

    console.log('Total amount comparison:', {
      calculated: calculatedTotal,
      received: totalAmount,
      difference: Math.abs(calculatedTotal - totalAmount)
    });

    // Verify total amount matches
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ 
        message: "Total amount mismatch",
        expected: calculatedTotal,
        received: totalAmount
      });
    }

    // Validate all books exist and are available
    const bookValidationResults = await Promise.all(
      items.map(async (item) => {
        try {
          const book = await Book.findOne({ id: item.bookId });
          console.log(`Book validation for ${item.bookId}:`, {
            found: !!book,
            available: book?.available,
            quantity: book?.quantity,
            rentPrice: book?.rentPrice,
            itemRentPrice: item.rentPrice
          });

          if (!book) {
            return { valid: false, message: `Book ${item.bookId} not found` };
          }
          if (!book.available || book.quantity <= 0) {
            return { valid: false, message: `Book ${item.bookId} is not available` };
          }
          if (Math.abs(book.rentPrice - item.rentPrice) > 0.01) {
            return { 
              valid: false, 
              message: `Price mismatch for book ${item.bookId}. Expected: ${book.rentPrice}, Got: ${item.rentPrice}` 
            };
          }
          return { valid: true, book };
        } catch (error) {
          console.error(`Error validating book ${item.bookId}:`, error);
          return { valid: false, message: `Error validating book ${item.bookId}: ${error.message}` };
        }
      })
    );

    const invalidBook = bookValidationResults.find(result => !result.valid);
    if (invalidBook) {
      console.log('Invalid book found:', invalidBook);
      return res.status(400).json({ message: invalidBook.message });
    }

    // Create payment record
    const payment = new Payment({
      userId: req.user.id,
      items: items.map(item => ({
        bookId: item.bookId,
        rentalDuration: item.rentalDuration,
        rentPrice: item.rentPrice
      })),
      totalAmount,
      status: 'pending',
      createdAt: new Date()
    });

    console.log('Creating payment:', {
      userId: payment.userId,
      itemCount: payment.items.length,
      totalAmount: payment.totalAmount
    });

    await payment.save();
    console.log('Payment saved successfully:', payment._id);

    // Update book quantities
    try {
      await Promise.all(
        items.map(async (item) => {
          const book = await Book.findOne({ id: item.bookId });
          book.quantity -= 1;
          book.available = book.quantity > 0;
          await book.save();
          console.log(`Updated quantity for book ${item.bookId}:`, {
            newQuantity: book.quantity,
            available: book.available
          });
        })
      );
    } catch (error) {
      console.error('Error updating book quantities:', error);
      // Rollback payment creation
      await Payment.deleteOne({ _id: payment._id });
      throw new Error('Failed to update book quantities');
    }

    // Return success response
    res.status(201).json({ 
      message: "Payment created successfully",
      paymentId: payment._id,
      totalAmount: payment.totalAmount
    });

  } catch (error) {
    console.error("Error creating payment:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error",
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: "Error creating payment",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});