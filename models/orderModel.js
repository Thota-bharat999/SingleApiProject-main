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
      ref: "User",
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
  },
  { timestamps: true }
);

// 🔥 Pre-save hook to generate unique orderCode
orderSchema.pre("save", function (next) {
  if (this.paymentStatus === "Successful") this.status = "Delivered";
  else if (this.paymentStatus === "Failed") this.status = "Failed";
  else this.status = "Pending";
  next();
});


module.exports = mongoose.model("Order", orderSchema);
