const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true }, // Must match prod123
  name: { type: String, required: true },
  description: String,
  price: Number,
  stock: Number,
  categoryId: String,
  categoryName:String
});

module.exports = mongoose.model('Product', productSchema);
