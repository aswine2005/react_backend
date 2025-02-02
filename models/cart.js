const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'Book reference is required']
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    rentalDuration: {
        type: Number,
        required: true,
        min: [1, 'Rental duration must be at least 1 day'],
        default: 1
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Total amount cannot be negative']
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add index for better query performance
cartSchema.index({ user: 1 });

// Pre-save middleware to ensure totalAmount is valid
cartSchema.pre('save', function(next) {
    if (this.totalAmount < 0) {
        next(new Error('Total amount cannot be negative'));
    }
    if (!this.user) {
        next(new Error('User reference is required'));
    }
    if (!this.items || this.items.length === 0) {
        this.totalAmount = 0;
    }
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
