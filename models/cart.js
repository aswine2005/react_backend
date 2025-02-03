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

// Create single unique index on user field
cartSchema.index({ user: 1 }, { 
    unique: true,
    background: true 
});

const Cart = mongoose.model('Cart', cartSchema);

// Clean up old indexes if they exist
Cart.collection.getIndexes()
    .then(indexes => {
        Object.keys(indexes).forEach(indexName => {
            if (indexName !== '_id_' && indexName.includes('userId')) {
                Cart.collection.dropIndex(indexName)
                    .catch(err => console.log('Index drop error (can be ignored):', err));
            }
        });
    })
    .catch(err => console.log('Get indexes error (can be ignored):', err));

module.exports = Cart;
