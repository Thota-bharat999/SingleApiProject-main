const adminLogger=require('../utils/adminLogger')
const Order = require('../models/orderModel');
const Messages = require("../utils/messages");

const Product = require('./productModel');

exports.getPaginatedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    adminLogger.info(`Fetching orders - Page: ${page}, Limit: ${limit}`);
    const orders = await Order.find()
      .populate('userId', 'email') // gets user email
      .skip(skip)
      .limit(limit)
      .lean();

    const totalOrders = await Order.countDocuments();

    const formattedOrders = await Promise.all(
    orders.map(async (order) => {
    const productsArray = Array.isArray(order.products) ? order.products : [];

    const enrichedProducts = await Promise.all(productsArray.map(async (p) => {
      if (typeof p === 'object' && p.name) return p; // already detailed
      const product = await Product.findById(p.productId || p).lean();
      return {
        productId: product?._id || p.productId || p,
        name: product?.name || 'Unknown',
        price: product?.price || 0
      };
    }));

    return {
      orderId: order.orderId,
      status: order.status,
      userId: order.userId?._id || null,
      email: order.userId?.email || 'N/A',
      products: enrichedProducts,
      total: order.totalPrice
    };
  })
);
 adminLogger.info(`Orders fetched successfully - Returned ${formattedOrders.length} orders`);
    res.status(200).json({
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders: formattedOrders
    });

  } catch (err) {
     adminLogger.error(`Admin View Orders Error: ${err.message}`);
    res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
};
