const mongoose = require('mongoose');

const paymentItemSchema = new mongoose.Schema({
    bookId: { type: String, required: true },
    rentalDuration: { type: Number, required: true }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: [paymentItemSchema],
    totalAmount: { type: Number, required: true },
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

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
