const userLogger = require('../utils/userLogger');
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Messages = require("../utils/messages");
const Cart = require('../models/cartModel');

// Fallback logger if userLogger isn't available
const logger = (typeof userLogger !== 'undefined' && userLogger) || console;

/**
 * POST /api/user/order
 * Body: { paymentMethod, total?, paymentId?, paymentStatus? }
 * Response: { message, order }
 */
exports.placeOrder = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?._id;
    const userId = req.body.userId || authUserId;

    if (!userId) {
      logger.warn("⚠️ placeOrder: Missing userId", {
        ip: req.ip,
        endpoint: req.originalUrl,
        body: req.body,
      });
      return res.status(400).json({ message: "User ID required" });
    }

    const { paymentMethod, total, paymentId: bodyPaymentId, paymentStatus: bodyPaymentStatus } = req.body;

    if (!paymentMethod) {
      logger.warn("⚠️ placeOrder: Missing paymentMethod", { userId, body: req.body });
      return res.status(400).json({ message: "Payment method required" });
    }

    // Load cart
    const cart = await Cart.findOne({ userId });
    if (!cart || !Array.isArray(cart.products) || cart.products.length === 0) {
      logger.info(`🛒 Cart empty for userId=${userId}`, { userId, ip: req.ip });
      return res.status(404).json({ message: "Cart is empty" });
    }

    // Resolve payment info
    const resolvedPaymentId = bodyPaymentId || `pay_${Date.now()}`;
    const resolvedPaymentStatus = bodyPaymentStatus || "Failed";
    const resolvedTotal = typeof total === "number" ? total : cart.cartTotal;

    // Prepare order with snapshot of product details
    const orderPayload = {
      userId,
      items: cart.products.map(p => ({
        productId: p.productId,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        image: p.image || p.imageUrl || "/assets/images/no-image.png",
      })),
      total: resolvedTotal,
      paymentMethod,
      paymentId: resolvedPaymentId,
      paymentStatus: resolvedPaymentStatus,
      currency: cart.currency || "INR",
      status: resolvedPaymentStatus === "Successful" ? "Successful" : "Failed",
    };

    logger.debug("📝 Creating order", {
      userId,
      paymentId: resolvedPaymentId,
      paymentStatus: resolvedPaymentStatus,
      total: resolvedTotal,
      itemCount: cart.products.length,
    });

    const order = await Order.create(orderPayload);

    // Clear cart after order placement
    cart.products = [];
    await cart.save();

    logger.info("✅ Order placed & cart cleared", {
      userId,
      orderId: order._id,
      paymentId: resolvedPaymentId,
      paymentStatus: resolvedPaymentStatus,
      total: resolvedTotal,
    });

    return res.status(200).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    logger.error("❌ Error in placeOrder", {
      userId: req.body?.userId || req.user?.id || "unknown",
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      message: "Order placement failed",
      error: err.message,
    });
  }
};

/**
 * GET /api/user/orders
 * Returns list of orders with product details
 */
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;

    userLogger.debug(`Fetching orders for userId=${userId}`);

    if (!userId) {
      userLogger.warn("Missing userId in request");
      return res.status(400).json({ message: Messages.USER.ERROR.INVALID_ORDER });
    }

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).select("_id items total paymentMethod paymentStatus status createdAt");

    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    }));

    userLogger.info(`Found ${orders.length} orders for userId=${userId}`);
    res.json(formattedOrders);
  } catch (err) {
    userLogger.error(`Error fetching orders for userId=${req.user?.id || "unknown"} - ${err.message}`);
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};
