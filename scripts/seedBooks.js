// require('dotenv').config();
// const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');
// const Book = require('../models/book');

// const sampleBooks = [
//   {
//     id: uuidv4(),
//     title: "The Psychology of Money",
//     author: "Morgan Housel",
//     description: "Timeless lessons on wealth, greed, and happiness doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people.",
//     imageUrl: "https://m.media-amazon.com/images/I/41r6F2LRf8L._SY264_BO1,204,203,200_QL40_FMwebp_.jpg",
//     category: "Non-Fiction",
//     rentPrice: 299, // ₹299 per day
//     quantity: 5,
//     rating: 4.5,
//     available: true
//   },
//   {
//     id: uuidv4(),
//     title: "Atomic Habits",
//     author: "James Clear",
//     description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones. No matter your goals, Atomic Habits offers a proven framework for improving every day.",
//     imageUrl: "https://m.media-amazon.com/images/I/51-nXsSRfZL._SY264_BO1,204,203,200_QL40_FMwebp_.jpg",
//     category: "Non-Fiction",
//     rentPrice: 249, // ₹249 per day
//     quantity: 8,
//     rating: 4.8,
//     available: true
//   },
//   {
//     id: uuidv4(),
//     title: "The Silent Patient",
//     author: "Alex Michaelides",
//     description: "A woman shoots her husband dead. She never speaks another word. A criminal psychotherapist is determined to get her to talk and unravel the mystery of why she shot her husband.",
//     imageUrl: "https://m.media-amazon.com/images/I/41d1gVUK1yL._SY264_BO1,204,203,200_QL40_FMwebp_.jpg",
//     category: "Fiction",
//     rentPrice: 199, // ₹199 per day
//     quantity: 3,
//     rating: 4.3,
//     available: true
//   },
//   {
//     id: uuidv4(),
//     title: "Brief History of Time",
//     author: "Stephen Hawking",
//     description: "A landmark volume in science writing by one of the great minds of our time, Stephen Hawking's book explores such profound questions as: How did the universe begin—and what made its start possible?",
//     imageUrl: "https://m.media-amazon.com/images/I/51+GySc8ExL._SY344_BO1,204,203,200_.jpg",
//     category: "Science",
//     rentPrice: 349, // ₹349 per day
//     quantity: 4,
//     rating: 4.6,
//     available: true
//   },
//   {
//     id: uuidv4(),
//     title: "Clean Code",
//     author: "Robert C. Martin",
//     description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. This book is a must for any developer, software engineer, project manager, team lead, or systems analyst.",
//     imageUrl: "https://m.media-amazon.com/images/I/41xShlnTZTL._SY264_BO1,204,203,200_QL40_FMwebp_.jpg",
//     category: "Technology",
//     rentPrice: 399, // ₹399 per day
//     quantity: 6,
//     rating: 4.7,
//     available: true
//   },
//   {
//     id: uuidv4(),
//     title: "Steve Jobs",
//     author: "Walter Isaacson",
//     description: "The biography of Apple co-founder Steve Jobs. Based on more than forty interviews with Jobs conducted over two years—as well as interviews with more than 100 family members, friends, adversaries, competitors, and colleagues.",
//     imageUrl: "https://m.media-amazon.com/images/I/41ZlN7iry-L._SY264_BO1,204,203,200_QL40_FMwebp_.jpg",
//     category: "Biography",
//     rentPrice: 299, // ₹299 per day
//     quantity: 4,
//     rating: 4.4,
//     available: true
//   }
// ];

// const seedBooks = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log('Connected to MongoDB');

//     // Clear existing books
//     await Book.deleteMany({});
//     console.log('Cleared existing books');

//     // Insert new books
//     const books = await Book.insertMany(sampleBooks);
//     console.log('Added sample books:', books);

//     console.log('Database seeded successfully');
//     process.exit(0);
//   } catch (error) {
//     console.error('Error seeding database:', error);
//     process.exit(1);
//   }
// };

// seedBooks();
