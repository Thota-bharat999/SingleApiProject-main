const Cart = require('../models/cartModel'); // User-side cart model
const logger = require('../utils/logger');
const Messages = require("../utils/messages");
const Product = require("../Admin/productModel");

exports.addToCart = async (req, res) => {
  try {
    const { userId, products } = req.body;

    if (!userId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid request" });
    }

    let cart = await Cart.findOne({ userId });
    const updatedProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId).lean();
      if (!product) continue;

      const quantity = Number(item.quantity) || 1;
      const totalPrice = product.price * quantity;

      updatedProducts.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
        totalPrice,
        imageUrl: product.imageUrl || null,
        images: product.images || [],
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
