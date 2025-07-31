require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./Admin/upload/routes/uploadRoutes');
const adminRoutes = require('./Admin/adminRoutes');
const commonRoutes = require('./Admin/commonRoutes');
const { swaggerUi, specs } = require("./swagger");

app.use(cors());
const app = express();
app.use(express.json());




// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/user/cart', cartRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user', orderRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// DB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => logger.info("✅ MongoDB connected"))
.catch(err => logger.error("❌ MongoDB error", err));

app.get("/", (req, res) => {
  res.send("🟢 API is running... Welcome to Single API Project");
});
// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
