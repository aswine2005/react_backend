const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    rentedBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }]
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Password check method
userSchema.methods.checkPassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
