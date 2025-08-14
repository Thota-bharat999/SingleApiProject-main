const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      productId: String,
      name: String,
      price: Number,
      default: []
    }
  ],
  totalPrice: Number,
  status: { type: String, default: 'Success' }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

