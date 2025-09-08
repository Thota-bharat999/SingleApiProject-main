const userLogger = require('../utils/userLogger');
const mongoose = require("mongoose"); //
const Order = require("../models/orderModel");
const Messages = require("../utils/messages");

const Cart = require('../models/cartModel');
  // Fallback logger if userLogger isn't available in this module
  const logger = (typeof userLogger !== 'undefined' && userLogger) || console;

  // POST /api/user/order
  // Body: { cartItems: [{ productId, quantity }], paymentMethod: "Online"|"COD"|..., total?: number, paymentId?: string, paymentStatus?: string }
  // Response: { message, orderId, paymentId, paymentStatus }
  exports.placeOrder = async (req, res) => {
    try {
      const authUserId = req.user?.id || req.user?._id; // from auth middleware if present
      const userId = req.body.userId || authUserId;

      const { cartItems, paymentMethod, total, paymentId: bodyPaymentId, paymentStatus: bodyPaymentStatus } = req.body;

      if (!userId) {
        logger.warn("⚠️ placeOrder: Missing userId");
        return res.status(400).json({ message: Messages.USER.ERROR.VIEW_USERS_REQUIRED });
      }

      if (!Array.isArray(cartItems) || cartItems.length === 0 || !paymentMethod) {
        logger.warn("⚠️ placeOrder: Missing required fields", { body: req.body });
        return res.status(400).json({ message: Messages.USER.ERROR.MISSING_FIELDS });
      }

      // Load user's cart to derive totals and any existing payment metadata
      const cart = await Cart.findOne({ userId });
      if (!cart || !Array.isArray(cart.products) || cart.products.length === 0) {
        logger.info(`🛒 Cart empty or not found for userId=${userId}`);
        return res.status(404).json({ message: Messages.USER.ERROR.CART_USER_REQUIED });
      }

      // Prefer cart values if present; then body; then defaults
      const resolvedPaymentId = cart.paymentId || bodyPaymentId || `pay_${Date.now()}`;
      const resolvedPaymentStatus = cart.paymentStatus || bodyPaymentStatus || 'Pending';
      const resolvedTotal = typeof total === 'number' ? total : cart.cartTotal;

      // Persist the order
      const orderPayload = {
        userId,
        items: cartItems,
        total: resolvedTotal,
        paymentMethod,
        paymentId: resolvedPaymentId,
        paymentStatus: resolvedPaymentStatus,
        currency: cart.currency || 'INR',
      };

      const order = await Order.create(orderPayload);

      logger.info(`✅ Order placed for userId=${userId} orderId=${order._id} paymentId=${resolvedPaymentId} status=${resolvedPaymentStatus}`);

      // Return the existing shape plus the requested fields
      return res.status(200).json({
        message: Messages.USER.SUCCESS.PLACE_ORDER,
        orderId: order._id,
        paymentId: resolvedPaymentId,
        paymentStatus: resolvedPaymentStatus,
      });
    } catch (err) {
      logger.error(`❌ Error in placeOrder for userId=${req.body?.userId || req.user?.id || "unknown"}: ${err.message}`);
      return res.status(500).json({ message: Messages.USER.ERROR.PLACE_ORDER_FAILED, error: err.message });
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

