const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  price: Number,
  stock: Number,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
});

module.exports = mongoose.model('Product', productSchema);
