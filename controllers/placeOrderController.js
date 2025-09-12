const userLogger = require("../utils/userLogger");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Messages = require("../utils/messages");
const Cart = require("../models/cartModel");

// POST /api/user/order
exports.placeOrder = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?._id;
    const userId = req.body.userId || authUserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const { paymentMethod, total, paymentId, paymentStatus, cartItems } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method required" });
    }

    // Load cart or fallback to body.cartItems
    let items = [];
    let resolvedTotal = total;

    const cart = await Cart.findOne({ userId });
    if (cart && cart.products.length > 0) {
      items = cart.products;
      resolvedTotal = cart.cartTotal;
    } else if (Array.isArray(cartItems) && cartItems.length > 0) {
      items = cartItems;
    } else {
      return res.status(404).json({ message: "Cart is empty" });
    }

    const resolvedPaymentId = paymentId || `pay_${Date.now()}`;
    const resolvedPaymentStatus = paymentStatus || "Failed";

    const orderPayload = {
      userId,
      items,
      total: resolvedTotal,
      paymentMethod,
      paymentId: resolvedPaymentId,
      paymentStatus: resolvedPaymentStatus,
      currency: "INR",
      status: resolvedPaymentStatus === "Successful" ? "Successful" : "Failed",
    };

    const order = await Order.create(orderPayload);

    if (cart) {
      cart.products = [];
      cart.cartTotal = 0;
      await cart.save();
    }

    return res.status(200).json({
      message: "Order placed successfully",
      order: {
        orderCode: order.orderCode, // ✅ clean readable order code
        mongoId: order._id,         // optional raw Mongo ID
        paymentId: order.paymentId,
        paymentStatus: order.paymentStatus,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Order placement failed",
      error: err.message,
    });
  }
};


// GET /api/user/orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: Messages.USER.ERROR.INVALID_ORDER });
    }

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).select("orderCode items total paymentMethod paymentStatus status createdAt");

    const formattedOrders = orders.map((order) => ({
      orderCode: order.orderCode, // ✅ clean unique order code
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
    }));

    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};

