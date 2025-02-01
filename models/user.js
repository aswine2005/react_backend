const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const rentedBookSchema = new mongoose.Schema({
    bookId: { type: String, required: true },
    rentalDuration: { type: Number, required: true },
    rentStartDate: { type: Date, required: true },
    rentEndDate: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cart: [{ type: String }], // Array of book IDs
    rentedBooks: [rentedBookSchema],
    phoneNo: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Method to check password
userSchema.methods.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
