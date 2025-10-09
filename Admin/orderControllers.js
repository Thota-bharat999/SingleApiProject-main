const adminLogger = require('../utils/adminLogger');
const Order = require('../models/orderModel');
const Messages = require("../utils/messages");
const Product = require('../Admin/productModel');
const User = require('../models/userModel');

exports.getPaginatedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    adminLogger.info(`Fetching orders - Page: ${page}, Limit: ${limit}`);

    const orders = await Order.find()
      .populate('userId', 'email name') // ✅ Fetch email + name
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalOrders = await Order.countDocuments();

    const formattedOrders = orders.map((order) => ({
      mongoId: order._id,
      orderId: order.orderCode, // ✅ matches frontend expected field
      userId: order.userId?._id || null,
      email: order.userId?.email || null,
      name: order.userId?.name || null,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items?.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl || null,
      })) || [],
    }));

    adminLogger.info(`Orders fetched successfully - ${formattedOrders.length} orders returned`);

    return res.status(200).json({
      message: "Orders fetched successfully",
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders: formattedOrders,
    });
  } catch (err) {
    adminLogger.error(`Admin View Orders Error: ${err.message}`);
    return res.status(500).json({
      message: Messages.ADMIN.ERROR.SERVER_ERROR,
      error: err.message,
    });
  }
};
