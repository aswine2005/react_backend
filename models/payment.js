const mongoose = require('mongoose');

const paymentItemSchema = new mongoose.Schema({
    bookId: { 
        type: String, 
        required: true 
    },
    rentalDuration: { 
        type: Number, 
        required: true,
        min: [1, 'Rental duration must be at least 1 day'],
        max: [30, 'Rental duration cannot exceed 30 days']
    },
    rentPrice: {
        type: Number,
        required: true,
        min: [0, 'Rent price cannot be negative']
    }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true,
        index: true
    },
    items: {
        type: [paymentItemSchema],
        required: true,
        validate: [array => array.length > 0, 'At least one item is required']
    },
    totalAmount: { 
        type: Number, 
        required: true,
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
        required: true,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking'],
        required: false
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    processedAt: { 
        type: Date 
    }
});

// Add compound index for better query performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
