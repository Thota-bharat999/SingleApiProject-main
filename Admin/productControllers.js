const Product = require("./productModel");
const Category = require("./categoryModels");
const adminLogger = require("../utils/adminLogger");
const { v4: uuidv4 } = require("uuid");
const Messages = require("../utils/messages");

// ================== ADD PRODUCT ==================


exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categoryId, imageUrl, images } = req.body;

    if (!name || !price || !stock || !categoryId) {
      adminLogger.warn("Missing required fields in addProduct request");
      return res
        .status(400)
        .json({ message: Messages.ADMIN.ERROR.MISSING_FIELDS });
    }

    const productId = "prod_" + uuidv4().slice(0, 8);

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      categoryId,
      productId,
      imageUrl: imageUrl || null,   // ✅ add single image
      images: images || []          // ✅ add multiple images (array)
    });

    const saved = await newProduct.save();
    adminLogger.info(`Product added: ${saved.productId} - ${saved.name}`);

    // fetch categoryName from Category collection
    const productWithCategory = await Product.findById(saved._id)
      .populate("categoryId", "name");

    res.status(201).json({
      message: Messages.ADMIN.SUCCESS.ADD_PRODUCT,
      product: {
        productId: productWithCategory.productId,
        name: productWithCategory.name,
        description: productWithCategory.description,
        price: productWithCategory.price,
        stock: productWithCategory.stock,
        categoryId: productWithCategory.categoryId?._id,
        categoryName: productWithCategory.categoryId?.name || null,
        imageUrl: productWithCategory.imageUrl,  // ✅ return single image
        images: productWithCategory.images       // ✅ return multiple images
      },
    });
  } catch (err) {
    adminLogger.error(`Add Product Error: ${err.message}`);
    res.status(500).json({
      message: Messages.ADMIN.ERROR.SERVER_ERROR,
      error: err.message,
    });
  }
};


// ================== UPDATE PRODUCT ==================
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id.trim();
    adminLogger.info(`Incoming Product ID from params: ${productId}`);

    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      adminLogger.warn(`Product not found for update: ${productId}`);
      return res
        .status(404)
        .json({ message: Messages.ADMIN.ERROR.PRODUCT_NOT_FOUND });
    }

    // fetch categoryName from Category collection
    const category = await Category.findOne({
      id: updatedProduct.categoryId,
    });

    adminLogger.info(`Product updated successfully: ${productId}`);
    return res.json({
      message: Messages.ADMIN.SUCCESS.UPDATE_PRODUCT,
      product: {
        productId: updatedProduct.productId,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        stock: updatedProduct.stock,
        categoryId: updatedProduct.categoryId,
        categoryName: category ? category.name : null,
      },
    });
  } catch (err) {
    adminLogger.error(`Update Product Error: ${err.message}`);
    return res.status(500).json({
      message: Messages.ADMIN.ERROR.SERVER_ERROR,
      error: err.message,
    });
  }
};

// ================== DELETE PRODUCT ==================
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id.trim();
    adminLogger.info(`Attempting to delete product with ID: ${productId}`);

    const deleted = await Product.findOneAndDelete({ productId });
    if (!deleted) {
      adminLogger.warn(`Product not found: ${productId}`);
      return res
        .status(404)
        .json({ message: Messages.ADMIN.ERROR.PRODUCT_NOT_FOUND });
    }

    adminLogger.info(`Product deleted successfully: ${productId}`);
    res.json({ message: Messages.ADMIN.SUCCESS.DELETE_PRODUCT });
  } catch (err) {
    adminLogger.error(`Delete Product Error: ${err.message}`);
    res.status(500).json({
      message: Messages.ADMIN.ERROR.SERVER_ERROR,
      error: err.message,
    });
  }
};

// ================== GET PRODUCTS (Paginated with Category Name) ==================
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    adminLogger.info(`Fetching products - Page: ${page}, Limit: ${limit}`);

    const total = await Product.countDocuments();

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "categories", // Category collection
          localField: "categoryId",
          foreignField: "id",
          as: "categoryData",
        },
      },
      {
        $unwind: {
          path: "$categoryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          __v: 0,
          "categoryData._id": 0,
          "categoryData.__v": 0,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    adminLogger.info(`Successfully fetched ${products.length} products`);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products: products.map((p) => ({
        productId: p.productId,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: p.categoryId,
        categoryName: p.categoryData ? p.categoryData.name : null,
      })),
    });
  } catch (err) {
    adminLogger.error(`Get Paginated Products Error: ${err.message}`);
    return res.status(500).json({
      message: Messages.ADMIN.ERROR.SERVER_ERROR,
      error: err.message,
    });
  }
};
