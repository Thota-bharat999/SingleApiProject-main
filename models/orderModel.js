const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ reference to User collection
      required: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        imageUrl: { type: String },
      },
    ],
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, required: true },
    paymentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Successful", "Failed"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Pending", "Delivered", "Failed"],
      default: "Pending",
    },
    // ✅ New virtual fields for user info
    userEmail: {
      type: String,
      default: null,
    },
    userName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔥 Pre-validate hook to auto-generate orderCode
orderSchema.pre("validate", function (next) {
  if (!this.orderCode) {
    const timestamp = Date.now();
    this.orderCode = `ORD-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

// ✅ Auto-populate user details whenever order is fetched
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "userId",
    select: "email name", // only fetch what we need
  });
  next();
});

// ✅ Add virtuals in JSON output
orderSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.userId && typeof ret.userId === "object") {
      ret.userEmail = ret.userId.email || null;
      ret.userName = ret.userId.name || null;
      ret.userId = ret.userId._id;
    }
    return ret;
  },
});

module.exports = mongoose.model("Order", orderSchema);
