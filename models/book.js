const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const bookSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography']
    },
    imageUrl: {
        type: String,
        required: true
    },
    rentPrice: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 1
    },
    available: {
        type: Boolean,
        default: true
    },
    feedback: [feedbackSchema],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRentals: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate average rating before saving
bookSchema.pre('save', function(next) {
    if (this.feedback && this.feedback.length > 0) {
        this.averageRating = this.feedback.reduce((acc, curr) => acc + curr.rating, 0) / this.feedback.length;
    }
    this.available = this.quantity > 0;
    next();
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
