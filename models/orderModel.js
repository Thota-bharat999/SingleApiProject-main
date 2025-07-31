const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cartItems: [
    {
      productId: String,
      quantity: Number
    }
  ],
  paymentMethod: String,
  status: {
    type: String,
    default: "Successful" // ✅ changed from "Pending" to "Successful"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
