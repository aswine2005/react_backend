const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    quantity: { type: Number, required: true },
    available: { type: Boolean, default: true },
    rentPrice: { type: Number, required: true },
    category: { type: String, required: true },
    feedback: [{
        userId: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }]
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
