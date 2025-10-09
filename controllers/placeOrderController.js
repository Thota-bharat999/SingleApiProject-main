const userLogger = require("../utils/userLogger");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Messages = require("../utils/messages");
const Cart = require("../models/cartModel");
const User = require("../models/userModel"); // ✅ make sure this model exists

// ==========================
// POST /api/user/order
// ==========================
exports.placeOrder = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?._id;
    const userId = req.body.userId || authUserId;

    if (!userId) {
      userLogger.warn("❌ Order placement failed: Missing userId in request.");
      return res.status(400).json({ message: "User ID required" });
    }

    const { paymentMethod, total, paymentId, paymentStatus, cartItems } = req.body;

    if (!paymentMethod) {
      userLogger.warn(`⚠️ [User: ${userId}] Tried placing order without payment method.`);
      return res.status(400).json({ message: "Payment method required" });
    }

    // 🛒 Load cart or fallback to cartItems
    let items = [];
    let resolvedTotal = total;

    const cart = await Cart.findOne({ userId });
    if (cart && cart.products.length > 0) {
      items = cart.products;
      resolvedTotal = cart.cartTotal;
      userLogger.info(`🛒 [User: ${userId}] Using existing cart for order.`);
    } else if (Array.isArray(cartItems) && cartItems.length > 0) {
      items = cartItems;
      userLogger.info(`🛒 [User: ${userId}] Using cartItems from request body.`);
    } else {
      userLogger.warn(`⚠️ [User: ${userId}] Attempted to place order with empty cart.`);
      return res.status(404).json({ message: "Cart is empty" });
    }

    // 💳 Payment details
    const resolvedPaymentId = paymentId || `pay_${Date.now()}`;
    const resolvedPaymentStatus = paymentStatus || "Failed";

    // ✅ Correctly map order status
    let orderStatus = "Pending";
    if (resolvedPaymentStatus === "Successful") orderStatus = "Delivered";
    if (resolvedPaymentStatus === "Failed") orderStatus = "Failed";

    // 🧾 Create order payload
    const orderPayload = {
      userId,
      items,
      total: resolvedTotal,
      paymentMethod,
      paymentId: resolvedPaymentId,
      paymentStatus: resolvedPaymentStatus,
      currency: "INR",
      status: orderStatus,
      orderCode: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    // 🧠 Save order in DB
    const order = await Order.create(orderPayload);

    // ✅ Fetch user info to include email in response
    const user = await User.findById(userId).select("email name");

    userLogger.info(`✅ [User: ${userId}] Order placed successfully. OrderCode: ${order.orderCode}`);

    // 🧹 Clear user's cart
    if (cart) {
      cart.products = [];
      cart.cartTotal = 0;
      await cart.save();
      userLogger.info(`🧹 [User: ${userId}] Cart cleared after order placement.`);
    }

    // ✅ Full response
    return res.status(200).json({
      message: "Order placed successfully",
      order: {
        mongoId: order._id, // ✅ actual MongoDB ID
        orderId: order.orderCode,
        userId: userId,
        email: user?.email || null,
        name: user?.name || null,
        paymentId: order.paymentId,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items,
      },
    });

  } catch (err) {
    userLogger.error(`🔥 [Order Placement Error] ${err.message}`, {
      stack: err.stack,
      user: req.user?._id || req.user?.id,
      body: req.body,
    });

    return res.status(500).json({
      message: "Order placement failed",
      error: err.message,
    });
  }
};

// ==========================
// GET /api/user/orders
// ==========================
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      userLogger.warn("⚠️ getUserOrders called without valid userId.");
      return res.status(400).json({ message: Messages.USER.ERROR.INVALID_ORDER });
    }

    // ✅ Fetch user to include email
    const user = await User.findById(userId).select("email name");

    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .select("orderCode items total paymentMethod paymentStatus status currency createdAt updatedAt");

    userLogger.info(`📦 [User: ${userId}] Retrieved ${orders.length} orders.`);

    const formattedOrders = orders.map(order => ({
      mongoId: order._id,
      orderId: order.orderCode,
      userId,
      email: user?.email || null,
      name: user?.name || null,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items,
    }));

    res.json({
      count: formattedOrders.length,
      orders: formattedOrders,
    });

  } catch (err) {
    userLogger.error(`🔥 [Get Orders Error] ${err.message}`, {
      stack: err.stack,
      user: req.user?._id || req.user?.id,
    });

    res.status(500).json({
      message: Messages.COMMON.ERROR.SERVER_ERROR,
      error: err.message,
    });
  }
};
