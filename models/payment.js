const mongoose = require('mongoose');

const paymentItemSchema = new mongoose.Schema({
    bookId: { 
        type: String, 
        required: [true, 'Book ID is required'],
        trim: true
    },
    rentalDuration: { 
        type: Number, 
        required: [true, 'Rental duration is required'],
        min: [1, 'Rental duration must be at least 1 day'],
        max: [30, 'Rental duration cannot exceed 30 days']
    },
    rentPrice: {
        type: Number,
        required: [true, 'Rent price is required'],
        min: [0, 'Rent price cannot be negative'],
        validate: {
            validator: function(value) {
                return value > 0;
            },
            message: 'Rent price must be a positive number'
        }
    }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: [true, 'User ID is required'],
        index: true,
        trim: true
    },
    items: {
        type: [paymentItemSchema],
        required: [true, 'Payment must have at least one item'],
        validate: [
            {
                validator: function(items) {
                    return items.length > 0;
                },
                message: 'At least one item is required'
            },
            {
                validator: function(items) {
                    // Ensure no duplicate book IDs
                    const bookIds = items.map(item => item.bookId);
                    return new Set(bookIds).size === bookIds.length;
                },
                message: 'Duplicate book IDs are not allowed'
            }
        ]
    },
    totalAmount: { 
        type: Number, 
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
        validate: {
            validator: function(value) {
                // Calculate total from items
                const calculatedTotal = this.items.reduce((total, item) => {
                    return total + (item.rentPrice * item.rentalDuration);
                }, 0);
                
                // Allow for small floating point differences
                return Math.abs(calculatedTotal - value) < 0.01;
            },
            message: 'Total amount must match the sum of item prices'
        }
    },
    status: {
        type: String,
        required: [true, 'Payment status is required'],
        enum: {
            values: ['pending', 'completed', 'failed'],
            message: 'Invalid payment status'
        },
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ['card', 'upi', 'netbanking'],
            message: 'Invalid payment method'
        },
        required: false
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    processedAt: { 
        type: Date 
    }
}, {
    timestamps: true,
    strict: true
});

// Add compound indexes for better query performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save hook for additional validation
paymentSchema.pre('save', function(next) {
    // Ensure total amount is calculated correctly
    const calculatedTotal = this.items.reduce((total, item) => {
        return total + (item.rentPrice * item.rentalDuration);
    }, 0);

    if (Math.abs(calculatedTotal - this.totalAmount) >= 0.01) {
        next(new Error('Total amount must match the sum of item prices'));
    } else {
        next();
    }
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
