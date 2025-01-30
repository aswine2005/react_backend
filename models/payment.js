const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    bookId: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { 
        type: String, 
        required: true,
        enum: ['credit_card', 'debit_card', 'upi', 'net_banking']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    transactionId: { type: String },
    rentDuration: { type: Number, required: true }, // in days
    rentStartDate: { type: Date, default: Date.now },
    rentEndDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
