const Cart = require('../models/cartModel'); // User-side cart model
const logger = require('../utils/logger');
const Messages = require("../utils/messages");
const Product = require("../Admin/productModel");

exports.addToCart = async (req, res) => {
  try {
    const { userId, products } = req.body;
    const { limit = 10, offset = 0 } = req.query;

    if (!userId || !Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: Messages.USER.ERROR.ADD_TO_CART_INVALID });
    }

    // fetch product details from DB
    const productIds = products.map((p) => p.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();

    if (!dbProducts || dbProducts.length === 0) {
      return res
        .status(404)
        .json({ message: "Some products not found in database" });
    }

    let cart = await Cart.findOne({ userId });

    let cartTotal = 0;

    // prepare updated products with DB price
    const updatedProducts = products.map((item) => {
      const productFromDB = dbProducts.find(
        (p) => String(p._id) === String(item.productId)
      );

      const price = productFromDB ? Number(productFromDB.price) : 0;
      const name = productFromDB ? productFromDB.name : item.name || "";
      const quantity = Number(item.quantity) || 0;
      const totalPrice = price * quantity;

      cartTotal += totalPrice;

      return {
        productId: item.productId,
        name,
        price,
        quantity,
        totalPrice,
      };
    });

    if (cart) {
      // merge into existing cart
      updatedProducts.forEach((newItem) => {
        const existingItem = cart.products.find(
          (p) => String(p.productId) === String(newItem.productId)
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

      // recalc total
      cart.cartTotal = cart.products.reduce((sum, p) => sum + p.totalPrice, 0);
    } else {
      // create new cart
      cart = new Cart({
        userId,
        products: updatedProducts,
        cartTotal,
        currency: "INR",
      });
    }

    await cart.save();

    // Pagination
    const totalProducts = cart.products.length;
    const paginatedProducts = cart.products.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    // Fetch images for only paginated products
    const pageProductIds = paginatedProducts.map((p) => p.productId);
    const foundProducts = await Product.find(
      { _id: { $in: pageProductIds } },
      { _id: 1, imageUrl: 1, images: 1 }
    ).lean();

    const imageMap = new Map(
      foundProducts.map((p) => [
        String(p._id),
        {
          imageUrl: p.imageUrl || null,
          images: Array.isArray(p.images) ? p.images : [],
        },
      ])
    );

    const enrichedProducts = paginatedProducts.map((p) => ({
      ...p.toObject?.() || p,
      imageUrl: imageMap.get(String(p.productId))?.imageUrl || null,
      images: imageMap.get(String(p.productId))?.images || [],
    }));

    res.status(200).json({
      message: Messages.USER.SUCCESS.ADD_TO_CART,
      cartTotal: cart.cartTotal,
      totalProducts,
      products: enrichedProducts,
      hasMore: parseInt(offset) + parseInt(limit) < totalProducts,
    });
  } catch (err) {
    logger.error(`❌ Error in addToCart: ${err.message}`);
    res.status(500).json({
      message: Messages.COMMON.ERROR.SERVER_ERROR,
      error: err.message,
    });
  }
};
