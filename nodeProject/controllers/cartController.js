const Cart = require('../models/cartModel'); // User-side cart model
const logger = require('../utils/logger');
const Messages = require("../utils/messages");

exports.addToCart = async (req, res) => {
  try {
    const { userId, products } = req.body;

    if (!userId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message:Messages.USER.ERROR.ADD_TO_CART_INVALID });
    }

    let cart = await Cart.findOne({ userId });
    let cartTotal = 0;

    // Step 1: Recalculate totalPrice for each product
    const updatedProducts = products.map((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      const totalPrice = price * quantity;

      cartTotal += totalPrice;

      return {
        productId: item.productId,
        name: item.name || "", // optional
        price,
        quantity,
        totalPrice,
      };
    });

    // Step 2: Create or Update Cart
    if (cart) {
      // Merge logic
      updatedProducts.forEach((newItem) => {
        const existingItem = cart.products.find(
          (item) => item.productId === newItem.productId
        );

        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          existingItem.totalPrice += newItem.totalPrice;
        } else {
          cart.products.push(newItem);
        }
      });

      // Update cart total
      cart.cartTotal = cart.products.reduce((sum, item) => sum + item.totalPrice, 0);
    } else {
      cart = new Cart({
        userId,
        products: updatedProducts,
        cartTotal,
        currency: 'INR',
      });
    }

    await cart.save();
    logger.info(`✅ Cart saved for userId: ${userId}`);
    res.status(200).json({ message: Messages.USER.SUCCESS.ADD_TO_CART });

  } catch (err) {
    logger.error(`❌ Error in addToCart: ${err.message}`);
    res.status(500).json({ message:Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};
