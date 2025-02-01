const mongoose = require('mongoose');

const paymentItemSchema = new mongoose.Schema({
    bookId: { type: String, required: true },
    rentalDuration: { type: Number, required: true, min: 1 }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: {
        type: [paymentItemSchema],
        required: true,
        validate: [array => array.length > 0, 'At least one item is required']
    },
    totalAmount: { 
        type: Number, 
        required: true,
        min: [0, 'Total amount cannot be negative']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    cardDetails: {
        number: String,
        expiryMonth: String,
        expiryYear: String,
        cvv: String
    },
    createdAt: { type: Date, default: Date.now },
    processedAt: { type: Date }
});

// Add indexes for better query performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
