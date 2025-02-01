const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    bookId: { type: String, required: true },
    rentalDuration: { type: Number, required: true, default: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
