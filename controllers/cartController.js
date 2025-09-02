const Cart = require('../models/cartModel'); // User-side cart model
const logger = require('../utils/logger');
const Messages = require("../utils/messages");
const Product = require("../Admin/productModel");

exports.addToCart = async (req, res) => {
  try {
    const { userId, products } = req.body;
    const { limit = 10, offset = 0 } = req.query; // 👈 pagination params (defaults)

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
        name: item.name || "",
        price,
        quantity,
        totalPrice,
      };
    });

    if (cart) {
      // Merge existing items
      updatedProducts.forEach((newItem) => {
        const existingItem = cart.products.find(
          (p) => p.productId === newItem.productId
        );
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          existingItem.totalPrice += newItem.totalPrice;
          if (!existingItem.name && newItem.name) {
            existingItem.name = newItem.name;
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

    // ✅ Pagination logic for infinite scrolling
    const totalProducts = cart.products.length;
    const paginatedProducts = cart.products.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    // Enrich cart items with product images
    const pageProductIds = paginatedProducts.map((p) => p.productId);
    const foundProducts = await Product.find(
      { productId: { $in: pageProductIds } },
      { productId: 1, imageUrl: 1, images: 1 }
    ).lean();

    const imageMap = new Map(
      foundProducts.map((p) => [
        p.productId,
        {
          imageUrl: p.imageUrl || null,
          images: Array.isArray(p.images) ? p.images : [],
        },
      ])
    );

    const enrichedProducts = paginatedProducts.map((p) => ({
      ...p,
      imageUrl: imageMap.get(p.productId)?.imageUrl || null,
      images: imageMap.get(p.productId)?.images || [],
    }));

    res.status(200).json({
      message: Messages.USER.SUCCESS.ADD_TO_CART,
      cartTotal: cart.cartTotal,
      totalProducts,
      products: enrichedProducts, // only send the current page with images
      hasMore: parseInt(offset) + parseInt(limit) < totalProducts, // 👈 helpful for infinite scroll
    });
  } catch (err) {
    logger.error(`❌ Error in addToCart: ${err.message}`);
    res
      .status(500)
      .json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};

