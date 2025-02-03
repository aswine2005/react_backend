// const mongoose = require('mongoose');
// const Book = require('../models/book');

// // Import the books data
// const { books } = require('./seedBooks');

// const seedProductionDB = async () => {
//     const PRODUCTION_URI = process.env.PRODUCTION_MONGODB_URI || 'your_production_mongodb_uri_here';
    
//     try {
//         // Connect to Production MongoDB
//         await mongoose.connect(PRODUCTION_URI);
//         console.log('Connected to Production MongoDB');

//         // Clear existing books
//         await Book.deleteMany({});
//         console.log('Cleared existing books');

//         // Insert new books
//         await Book.insertMany(books);
//         console.log('Added sample books successfully');

//         // Disconnect from MongoDB
//         await mongoose.disconnect();
//         console.log('Disconnected from MongoDB');

//     } catch (error) {
//         console.error('Error seeding production database:', error);
//         process.exit(1);
//     }
// };

// // Only run if explicitly called
// if (require.main === module) {
//     // Make sure we have the production URI
//     if (!process.env.PRODUCTION_MONGODB_URI) {
//         console.error('Error: PRODUCTION_MONGODB_URI environment variable is required');
//         process.exit(1);
//     }
//     seedProductionDB();
// }
