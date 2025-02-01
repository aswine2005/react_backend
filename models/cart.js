const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    bookId: { 
        type: String, 
        required: true 
    },
    rentalDuration: { 
        type: Number, 
        required: true,
        min: [1, 'Rental duration must be at least 1 day'],
        max: [30, 'Rental duration cannot exceed 30 days'],
        default: 1
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
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt timestamp before saving
cartSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Add index for better query performance
cartSchema.index({ userId: 1, updatedAt: -1 });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
