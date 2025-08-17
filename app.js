require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');

// Routes
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./Admin/upload/routes/uploadRoutes');
const adminRoutes = require('./Admin/adminRoutes');
const commonRoutes = require('./Admin/commonRoutes');

// Swagger
const { swaggerUi, specs } = require('./swagger');

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Route Middlewares
app.use('/api/user', userRoutes);
app.use('/api/user/cart', cartRoutes);
app.use('/api/user', orderRoutes); // Make sure userRoutes and orderRoutes do not conflict
app.use('/api/admin', adminRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/common', commonRoutes);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info("✅ MongoDB connected"))
.catch(err => logger.error("❌ MongoDB error", err));

// Health check for base URL
app.get('/', (req, res) => {
  res.send('🚀 API is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
