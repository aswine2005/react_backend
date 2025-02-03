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
        unique: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true }
});

// Drop any existing indexes
cartSchema.indexes().forEach(async (index) => {
    if (index.key.userId) {
        await mongoose.model('Cart').collection.dropIndex(index.name);
    }
});

// Create new index for user field
cartSchema.index({ user: 1 }, { 
    unique: true,
    name: 'user_unique_index'
});

module.exports = mongoose.model('Cart', cartSchema);
