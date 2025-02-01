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
app.use(cors());

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

// Book APIs
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

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Error fetching books" });
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
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = { items: [] };
    }

    // Fetch book details for each cart item
    const cartItemsWithDetails = await Promise.all(
      cart.items.map(async (item) => {
        const book = await Book.findOne({ id: item.bookId });
        return {
          ...item.toObject(),
          book
        };
      })
    );

    res.json({ items: cartItemsWithDetails });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Error fetching cart" });
  }
});

app.post("/api/cart/add", auth, async (req, res) => {
  try {
    const { bookId, rentalDuration = 1 } = req.body;
    
    // Validate book exists
    const book = await Book.findOne({ id: bookId });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
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

    // Add book to cart
    cart.items.push({ bookId, rentalDuration });
    cart.updatedAt = new Date();
    await cart.save();

    res.status(201).json({ message: "Book added to cart", cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

app.delete("/api/cart/remove/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.bookId !== bookId);
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Error removing from cart" });
  }
});

app.put("/api/cart/update/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const { rentalDuration } = req.body;
    
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(item => item.bookId === bookId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.rentalDuration = rentalDuration;
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Cart updated", cart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Error updating cart" });
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
app.post("/api/payments/initiate", auth, async (req, res) => {
  try {
    const { bookId, paymentMethod, rentDuration } = req.body;

    // Validate required fields
    if (!bookId || !paymentMethod || !rentDuration) {
      return res.status(400).json({ 
        message: "Missing required fields. Please provide bookId, paymentMethod, and rentDuration" 
      });
    }

    // Validate payment method
    const validPaymentMethods = ['credit_card', 'debit_card', 'upi', 'net_banking'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        message: "Invalid payment method. Use: credit_card, debit_card, upi, or net_banking" 
      });
    }

    const book = await Book.findOne({ id: bookId });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.available || book.quantity <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    // Calculate rent dates
    const rentStartDate = new Date();
    const rentEndDate = new Date(rentStartDate);
    rentEndDate.setDate(rentEndDate.getDate() + rentDuration);

    // Calculate total amount
    const amount = book.rentPrice * rentDuration;

    const payment = new Payment({
      id: uuidv4(),
      userId: req.user.id,
      bookId: book.id,
      amount,
      paymentMethod,
      status: 'pending',
      rentDuration,
      rentStartDate,
      rentEndDate
    });

    await payment.save();

    res.status(201).json({
      message: "Payment initiated successfully",
      payment: {
        id: payment.id,
        amount,
        paymentMethod,
        status: payment.status,
        rentStartDate,
        rentEndDate,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          rentPrice: book.rentPrice
        }
      }
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ message: "Error initiating payment", error: error.message });
  }
});

app.post("/api/payments/:paymentId/process", auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    // Auto-generate a transaction ID
    const transactionId = 'TXN_' + uuidv4();

    const payment = await Payment.findOne({ id: paymentId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to process this payment" });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Get book and verify availability again
    const book = await Book.findOne({ id: payment.bookId });
    if (!book || !book.available || book.quantity <= 0) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: "Book no longer available" });
    }

    // Update payment
    payment.status = 'completed';
    payment.transactionId = transactionId;
    await payment.save();

    // Update book quantity
    book.quantity -= 1;
    book.available = book.quantity > 0;
    await book.save();

    // Update user's rented books
    const user = await User.findOne({ id: req.user.id });
    user.rentedBooks.push(payment.bookId);
    // Remove book from cart if it's there
    user.cart = user.cart.filter(id => id !== payment.bookId);
    await user.save();

    res.json({
      message: "Payment processed successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        transactionId,
        rentStartDate: payment.rentStartDate,
        rentEndDate: payment.rentEndDate,
        book: {
          id: book.id,
          title: book.title,
          author: book.author
        }
      }
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Error processing payment", error: error.message });
  }
});

app.get("/api/payments", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id });
    
    // Get book details for each payment
    const paymentDetails = await Promise.all(
      payments.map(async (payment) => {
        const book = await Book.findOne({ id: payment.bookId });
        return {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          rentStartDate: payment.rentStartDate,
          rentEndDate: payment.rentEndDate,
          transactionId: payment.transactionId,
          book: book ? {
            id: book.id,
            title: book.title,
            author: book.author
          } : null
        };
      })
    );

    res.json({
      message: "Payments retrieved successfully",
      payments: paymentDetails
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
});

app.get("/api/payments/:paymentId", auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ id: paymentId });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this payment" });
    }

    // Get book details
    const book = await Book.findOne({ id: payment.bookId });

    res.json({
      message: "Payment retrieved successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        rentStartDate: payment.rentStartDate,
        rentEndDate: payment.rentEndDate,
        transactionId: payment.transactionId,
        book: book ? {
          id: book.id,
          title: book.title,
          author: book.author
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Error fetching payment", error: error.message });
  }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});