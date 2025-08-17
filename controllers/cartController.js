const Cart = require('../models/cartModel'); // User-side cart model
const logger = require('../utils/logger');
const Messages = require("../utils/messages");

exports.addToCart = async (req, res) => {
  try {
    const { userId, products } = req.body;

    if (!userId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: Messages.USER.ERROR.ADD_TO_CART_INVALID });
    }

    let cart = await Cart.findOne({ userId });

    // Prepare updated products
    let cartTotal = 0;
    const updatedProducts = products.map((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      const totalPrice = price * quantity;

      cartTotal += totalPrice;

      return {
        productId: item.productId,
        name: item.name || "", // Always keep name
        price,
        quantity,
        totalPrice
      };
    });

    if (cart) {
      // Merge existing items
      updatedProducts.forEach((newItem) => {
        const existingItem = cart.products.find(p => p.productId === newItem.productId);
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          existingItem.totalPrice += newItem.totalPrice;
          if (!existingItem.name && newItem.name) {
            existingItem.name = newItem.name; // Ensure name is filled
          }
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
        cartTotal,
        currency: "INR",
      });
    }

    await cart.save();

    res.status(200).json({
      message: Messages.USER.SUCCESS.ADD_TO_CART,
      cart // Send updated cart in response
    });

  } catch (err) {
    logger.error(`❌ Error in addToCart: ${err.message}`);
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};
