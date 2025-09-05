const Product = require("./productModel");
const Category = require("./categoryModels");
const adminLogger = require("../utils/adminLogger");
const { v4: uuidv4 } = require("uuid");
const Messages = require("../utils/messages");
const mongoose = require("mongoose");

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

    // Resolve categoryId to Category._id if a custom business id is provided
    let resolvedCategoryId = categoryId;
    if (!mongoose.isValidObjectId(categoryId)) {
      const cat = await Category.findOne({ id: categoryId }).lean();
      if (!cat) {
        adminLogger.warn(`Add Product failed: Invalid categoryId provided: ${categoryId}`);
        return res.status(400).json({ message: "Invalid categoryId" });
      }
      resolvedCategoryId = cat._id;
    }

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      categoryId: resolvedCategoryId,
      productId,
      imageUrl: imageUrl || null,
      images: images || []
    });

    const saved = await newProduct.save();
    adminLogger.info(`Product added: ${saved.productId} - ${saved.name}`);

    // Fetch category info
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
        categoryId: productWithCategory.categoryId?._id || null,
        categoryName: productWithCategory.categoryId?.name || "Uncategorized",
        imageUrl: productWithCategory.imageUrl,
        images: productWithCategory.images
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

    // Normalize categoryId in update to Category._id when a business id is provided
    const updateData = { ...req.body };
    if (updateData.categoryId && !mongoose.isValidObjectId(updateData.categoryId)) {
      const cat = await Category.findOne({ id: updateData.categoryId }).lean();
      if (!cat) {
        adminLogger.warn(`Update Product failed: Invalid categoryId provided: ${updateData.categoryId}`);
        return res.status(400).json({ message: "Invalid categoryId" });
      }
      updateData.categoryId = cat._id;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      updateData,
      { new: true }
    );

    if (!updatedProduct) {
      adminLogger.warn(`Product not found for update: ${productId}`);
      return res
        .status(404)
        .json({ message: Messages.ADMIN.ERROR.PRODUCT_NOT_FOUND });
    }

    // fetch categoryName from Category collection (works for either ObjectId or business id)
    let category = await Category.findById(updatedProduct.categoryId).lean();
    if (!category && typeof updatedProduct.categoryId === "string") {
      category = await Category.findOne({ id: updatedProduct.categoryId }).lean();
    }

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
          from: "categories",
          let: { cid: "$categoryId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$cid"] }, // when product.categoryId stores Category._id
                    { $eq: ["$_id", { $convert: { input: "$cid", to: "objectId", onError: null, onNull: null } }] },
                    { $eq: ["$id", "$cid"] },   // when product.categoryId stores Category.id (business id)
                  ],
                },
              },
            },
            { $project: { _id: 1, id: 1, name: 1 } },
          ],
          as: "categoryData",
        },
      },
      {
        $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          __v: 0,
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
        category: p.categoryData ? (p.categoryData.id || p.categoryData._id) : null,
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
