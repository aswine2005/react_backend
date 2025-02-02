const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    bookId: { 
        type: String, 
        required: true 
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    rentPrice: {
        type: Number,
        required: true
    },
    rentalDuration: { 
        type: Number, 
        required: true,
        min: [1, 'Rental duration must be at least 1 day'],
        max: [30, 'Rental duration cannot exceed 30 days'],
        default: 1
    },
    totalPrice: {
        type: Number,
        required: true
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true,
        index: true
    },
    items: {
        type: [cartItemSchema],
        default: [],
        validate: {
            validator: function(items) {
                // Ensure no duplicate books
                const bookIds = items.map(item => item.bookId);
                return new Set(bookIds).size === bookIds.length;
            },
            message: 'Duplicate books are not allowed in the cart'
        }
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.rentPrice * item.rentalDuration);
    }, 0);
    this.updatedAt = new Date();
    next();
});

// Add index for better query performance
cartSchema.index({ userId: 1, updatedAt: -1 });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
