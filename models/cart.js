const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    rentalDuration: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
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
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
