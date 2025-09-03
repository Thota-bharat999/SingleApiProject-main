const Cart = require('../models/cartModel'); // User-side cart model
const logger = require('../utils/logger');
const Messages = require("../utils/messages");
const Product = require("../Admin/productModel");
const mongoose = require('mongoose');

exports.addToCart = async (req, res) => {
  try {
    const { userId } = req.body;
    let { products } = req.body;

    // Normalize payload to support both array and single-item forms
    if ((!products || !Array.isArray(products) || products.length === 0) && req.body.productId) {
      products = [{ productId: req.body.productId, quantity: Number(req.body.quantity) || 1 }];
    }

    if (!userId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid request" });
    }

    let cart = await Cart.findOne({ userId });
    const updatedProducts = [];

    for (const item of products) {
      // Prefer lookup by custom productId (string). Fallback to _id when a valid ObjectId is provided.
      let product = await Product.findOne({ productId: item.productId }).lean();
      if (!product && mongoose.isValidObjectId(item.productId)) {
        product = await Product.findById(item.productId).lean();
      }
      if (!product) continue;

      const quantity = Number(item.quantity) || 1;
      const totalPrice = product.price * quantity;

      updatedProducts.push({
        productId: product.productId, // store the business productId (string)
        name: product.name,
        price: product.price,
        quantity,
        totalPrice,
        imageUrl: product.imageUrl || null,
        images: Array.isArray(product.images) ? product.images : [],
      });
    }

    if (cart) {
      // merge products
      updatedProducts.forEach((newItem) => {
        const existingItem = cart.products.find(
          (p) => String(p.productId) === String(newItem.productId)
        );
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          existingItem.totalPrice += newItem.totalPrice;
        } else {
          cart.products.push(newItem);
        }
      });
      cart.cartTotal = cart.products.reduce((sum, p) => sum + p.totalPrice, 0);
    } else {
      cart = new Cart({
        userId,
        products: updatedProducts,
        cartTotal: updatedProducts.reduce((sum, p) => sum + p.totalPrice, 0),
        currency: "INR",
      });
    }

    await cart.save();
    res.status(200).json({ message: "Added to cart successfully", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
