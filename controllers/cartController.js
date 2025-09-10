const Cart = require('../models/cartModel'); // User-side cart model
const logger = require('../utils/logger');
const Messages = require("../utils/messages");
const Product = require("../Admin/productModel");
const mongoose = require('mongoose');
const userLogger = require('../utils/userLogger');

exports.addToCart = async (req, res) => {
  try {
    const { userId } = req.body;
    let { products } = req.body;

    // Normalize payload (allow single product)
    if ((!products || !Array.isArray(products) || products.length === 0) && req.body.productId) {
      products = [{ productId: req.body.productId, quantity: Number(req.body.quantity) || 1 }];
    }

    userLogger.info(
      `[CART] AddToCart requested: userId=${userId || "unknown"}, items=${Array.isArray(products) ? products.length : 0}`
    );

    if (!userId || !Array.isArray(products) || products.length === 0) {
      userLogger.warn(
        `[CART] Invalid addToCart request: userId=${userId || "unknown"}, body=${JSON.stringify(req.body)}`
      );
      return res.status(400).json({ message: Messages.USER.ERROR.ADD_TO_CART_INVALID });
    }

    let cart = await Cart.findOne({ userId });
    const updatedProducts = [];

    for (const item of products) {
      let product = await Product.findOne({ productId: item.productId }).lean();

      if (!product && mongoose.isValidObjectId(item.productId)) {
        product = await Product.findById(item.productId).lean();
      }

      const quantity = Number(item.quantity) || 1;

      if (product) {
        // ✅ Use DB product data
        const totalPrice = product.price * quantity;

        updatedProducts.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          quantity,
          totalPrice,
          imageUrl: product.imageUrl || null,
          images: Array.isArray(product.images) ? product.images : [],
        });
      } else {
        // ✅ Fallback to request payload
        const totalPrice = (item.price || 0) * quantity;

        updatedProducts.push({
          productId: item.productId,
          name: item.name || "Unknown",
          price: item.price || 0,
          quantity,
          totalPrice,
          imageUrl: item.imageUrl || null,
          images: Array.isArray(item.images) ? item.images : [],
        });

        userLogger.warn(
          `[CART] Product not found in DB, using request payload for productId=${item.productId}`
        );
      }
    }

    if (cart) {
      // Merge products into existing cart
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
      // Create new cart
      cart = new Cart({
        userId,
        products: updatedProducts,
        cartTotal: updatedProducts.reduce((sum, p) => sum + p.totalPrice, 0),
        currency: "INR",
      });
    }

    await cart.save();
    userLogger.info(
      `[CART] Cart updated successfully for userId=${userId}. items=${cart.products.length}, cartTotal=${cart.cartTotal}`
    );
    res.status(200).json({ message: Messages.USER.SUCCESS.ADD_TO_CART, cart });
  } catch (err) {
    userLogger.error(
      `[CART] AddToCart error for userId=${req.body?.userId || "unknown"}: ${err.message}`
    );
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};


// Delete From Cart
exports.deleteFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      userLogger.warn("⚠️ deleteFromCart: Missing userId or productId", { body: req.body });
      return res.status(400).json({ message: Messages.USER.ERROR.ADD_TO_CART_INVALID });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      userLogger.info(`🛒 Cart not found for userId=${userId}`);
      return res.status(404).json({ message:Messages.USER.ERROR.CART_NOT_FOUND });
    }

    // Remove product
    const initialLength = cart.products.length;
    cart.products = cart.products.filter((p) => String(p.productId) !== String(productId));

    if (cart.products.length === initialLength) {
      userLogger.info(`❌ Product ${productId} not found in cart for userId=${userId}`);
      return res.status(404).json({ message:Messages.USER.ERROR.CART_PRODUCT_NOT_FOUND });
    }

    // Recalculate total
    cart.cartTotal = cart.products.reduce((sum, p) => sum + p.totalPrice, 0);

    await cart.save();

    userLogger.info(`✅ Product ${productId} removed from cart for userId=${userId}`);

    return res.status(200).json({
      message: Messages.USER.SUCCESS.CART_PRODUCT_REMOVED,
      cart,
    });
  } catch (err) {
    userLogger.error(`❌ Error in deleteFromCart for userId=${req.body?.userId || "unknown"}: ${err.message}`);
    return res.status(500).json({ message:Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};



