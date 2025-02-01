const mongoose = require('mongoose');
const Book = require('../models/book');
require('dotenv').config();

const books = [
    {
        id: "book1",
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        description: "Set in the summer of 1922 on Long Island, this American classic follows the mysterious millionaire Jay Gatsby and his obsession with Daisy Buchanan.",
        imageUrl: "https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg",
        quantity: 5,
        available: true,
        rentPrice: 8.99,
        category: "Classic Literature"
    },
    {
        id: "book2",
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        description: "Through the eyes of Scout Finch, this Pulitzer Prize-winning novel explores racial injustice in a small Southern town.",
        imageUrl: "https://m.media-amazon.com/images/I/71FxgtFKcQL._AC_UF1000,1000_QL80_.jpg",
        quantity: 3,
        available: true,
        rentPrice: 7.99,
        category: "Classic Literature"
    },
    {
        id: "book3",
        title: "1984",
        author: "George Orwell",
        description: "In a totalitarian future society, a man whose daily work is rewriting history tries to rebel by falling in love.",
        imageUrl: "https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg",
        quantity: 4,
        available: true,
        rentPrice: 9.99,
        category: "Science Fiction"
    },
    {
        id: "book4",
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        description: "Bilbo Baggins, a hobbit, embarks on a journey to the Lonely Mountain with a group of dwarves to reclaim their mountain home from a dragon named Smaug.",
        imageUrl: "https://m.media-amazon.com/images/I/710+HcoP38L._AC_UF1000,1000_QL80_.jpg",
        quantity: 6,
        available: true,
        rentPrice: 10.99,
        category: "Fantasy"
    },
    {
        id: "book5",
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "The story follows Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of early 19th-century England.",
        imageUrl: "https://m.media-amazon.com/images/I/71Q1tPupKjL._AC_UF1000,1000_QL80_.jpg",
        quantity: 3,
        available: true,
        rentPrice: 6.99,
        category: "Romance"
    },
    {
        id: "book6",
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        description: "The story of Holden Caulfield's three-day journey through New York City, exploring themes of teenage angst and alienation.",
        imageUrl: "https://m.media-amazon.com/images/I/61fgOuZfBGL._AC_UF1000,1000_QL80_.jpg",
        quantity: 4,
        available: true,
        rentPrice: 7.99,
        category: "Classic Literature"
    },
    {
        id: "book7",
        title: "Dune",
        author: "Frank Herbert",
        description: "Set in the distant future, Dune tells the story of Paul Atreides, whose family accepts control of the desert planet Arrakis, the only source of the most valuable substance in the cosmos.",
        imageUrl: "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg",
        quantity: 5,
        available: true,
        rentPrice: 11.99,
        category: "Science Fiction"
    },
    {
        id: "book8",
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien",
        description: "An epic high-fantasy novel that follows hobbits Frodo and Sam on their quest to destroy the One Ring and defeat the Dark Lord Sauron.",
        imageUrl: "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg",
        quantity: 4,
        available: true,
        rentPrice: 12.99,
        category: "Fantasy"
    }
];

const seedBooks = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing books
        await Book.deleteMany({});
        console.log('Cleared existing books');

        // Insert new books
        await Book.insertMany(books);
        console.log('Added sample books successfully');

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error seeding books:', error);
        process.exit(1);
    }
};

// Run the seed function
seedBooks();
