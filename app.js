require('dotenv').config();
const express = require('express');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const { swaggerUi, specs } = require("./swagger");
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./Admin/upload/routes/uploadRoutes');
const adminRoutes=require('./Admin/adminRoutes')
const commonRoutes = require('./Admin/commonRoutes');

const app = express();
app.use(express.json());



// Admin Routes
app.use('/api/admin', adminRoutes);
app.use('/api/common', commonRoutes);

app.use('/api/user/cart', cartRoutes);     // cart specific
app.use('/api/user', userRoutes); // user (register, login, profile)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/user', orderRoutes); 
app.use('/api/admin/upload', uploadRoutes);

mongoose.connect(process.env.MONGO_URL)
.then(() => logger.info("✅ MongoDB connected"))
  .catch(err => logger.error("❌ MongoDB error", err));

app.listen(process.env.PORT, () => {
  logger.info(`🚀 Server running on port ${process.env.PORT}`);
})