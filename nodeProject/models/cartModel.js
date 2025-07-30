const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: String,
  price: { type: Number, default: 0 },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, default: 0 }
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  products: [productSchema],
  cartTotal: { type: Number, default: 0 },
  currency: { type: String, default: "INR" }
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
module.exports = Cart;
