const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    bookId: {
        type: String,
        required: true,
        ref: 'Book'
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
        required: true,
        min: 0
    },
    rentalDuration: {
        type: Number,
        required: true,
        min: 1,
        max: 30,
        default: 1
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true,
        default: function() {
            const date = new Date();
            date.setDate(date.getDate() + this.rentalDuration);
            return date;
        }
    },
    totalPrice: {
        type: Number,
        required: true,
        default: function() {
            return this.rentPrice * this.rentalDuration;
        }
    }
}, { 
    _id: false,
    timestamps: true 
});

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
    status: {
        type: String,
        enum: ['active', 'checkout', 'completed', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + item.totalPrice;
    }, 0);
    next();
});

// Update end dates when rental duration changes
cartSchema.pre('save', function(next) {
    this.items.forEach(item => {
        const endDate = new Date(item.startDate);
        endDate.setDate(endDate.getDate() + item.rentalDuration);
        item.endDate = endDate;
        item.totalPrice = item.rentPrice * item.rentalDuration;
    });
    next();
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
