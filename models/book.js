const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        default: '/images/default-book.jpg'
    },
    rentPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    available: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRentals: {
        type: Number,
        default: 0
    },
    feedback: [feedbackSchema]
}, { 
    timestamps: true,
    toJSON: { virtuals: true }
});

// Add index for better performance
bookSchema.index({ title: 1, author: 1 });

// Calculate average rating before saving
bookSchema.pre('save', function(next) {
    if (this.feedback && this.feedback.length > 0) {
        this.averageRating = this.feedback.reduce((acc, curr) => acc + curr.rating, 0) / this.feedback.length;
    }
    this.available = this.quantity > 0;
    next();
});

module.exports = mongoose.model('Book', bookSchema);
