const userLogger = require('../utils/userLogger');
const mongoose = require("mongoose"); //
const Order = require("../models/orderModel");
const Messages = require("../utils/messages");

exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    userLogger.debug(`Incoming placeOrder request from userId: ${userId}`);
    userLogger.debug(`req.user object: ${JSON.stringify(req.user)}`); // ✅ corrected

    if (!userId) {
      userLogger.warn("User ID missing in request");
      return res.status(400).json({ message:Messages.USER.ERROR.INVALID_ORDER });
    }

    const { cartItems, paymentMethod } = req.body;

    if (!cartItems || !cartItems.length) {
      userLogger.warn(`Cart is empty or not found for userId: ${userId}`);
      return res.status(400).json({ message:Messages.USER.ERROR.CART_USER_REQUIED });
    }

    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(userId),
      cartItems,
      paymentMethod
    });

    userLogger.info(`Order placed successfully by userId: ${userId}, orderId: ${order._id}`);
    res.status(201).json({
      message: Messages.USER.SUCCESS.PLACE_ORDER,
      orderId: order._id,
    });
  } catch (err) {
    userLogger.error(`Error placing order for userId: ${req.user?.id || "unknown"} - ${err.message}`);
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    userLogger.debug(`Fecthing orders for UserId:${userId}`)

    if (!userId) {
      userLogger.warn("Missing UserId in request ")
      return res.status(400).json({ message: Messages.USER.ERROR.INVALID_ORDER });
    }

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).select("_id status");

    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      status: order.status,
    }));
   userLogger.info(`Found ${orders.length} orders for userId:${userId}`)
    res.json(formattedOrders);
  } catch (err) {
    userLogger.error(`Error fetching orders for userId: ${req.user?.id || "unknown"} - ${err.message}`);
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};

