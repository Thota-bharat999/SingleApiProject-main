const adminLogger = require("../utils/adminLogger");
const Product=require('./productModel');
const { v4: uuidv4 } = require('uuid');
const Messages = require("../utils/messages");

exports.addProduct=async(req,res)=>{
  try{
const {name,description,price,stock,categoryId }=req.body;
if(!name || !price || !stock || !categoryId){
     adminLogger.warn("Missing required fields in addProduct request");
    return res.status(400).json({message:Messages.ADMIN.ERROR.MISSING_FIELDS})
}
const productId='prod_' + uuidv4().slice(0, 8);
const newProduct=new Product({
    name,
    description,
    price,
    stock,
    categoryId,
    productId
});
const saved=await newProduct.save();
adminLogger.info(`Product added: ${saved.productId} - ${saved.name}`);
res.status(201).json({
     message:Messages.ADMIN.SUCCESS.ADD_PRODUCT,
     productId: saved.productId,
})
    }catch(err){
    adminLogger.error(`Add Product Error: ${err.message}`);
    res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
    }
}

// product Update
 // Update the path accordingly

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id.trim();
    adminLogger.info(`Incoming Product ID from params: ${productId}`);

    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      req.body,
      { new: true }
    );

    adminLogger.info("Updated Product result:", updatedProduct);

    if (!updatedProduct) {
      adminLogger.warn(`Product not found for update: ${productId}`);
      return res.status(404).json({ message:Messages.ADMIN.ERROR.PRODUCT_NOT_FOUND });
    }
     adminLogger.info(`Product updated successfully: ${productId}`);
    return res.json({
      message:Messages.ADMIN.SUCCESS.UPDATE_PRODUCT,
      product: updatedProduct
    });

  } catch (err) {
     adminLogger.error(`Update Product Error: ${err.message}`);
    return res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
};

// Delete Product
exports.deleteProduct=async(req,res)=>{
  try{
    const productId=req.params.id.trim();
    adminLogger.info(`Attempting to delete product with ID: ${productId}`);
    
    const deleted=await Product.findOneAndDelete({productId})
    if(!deleted){
    adminLogger.warn('product not found:${productId}')
      return res.status(404).json({message: Messages.ADMIN.ERROR.PRODUCT_NOT_FOUND})
    }
     adminLogger.info(`Product deleted successfully: ${productId}`);
    res.json({message: Messages.ADMIN.SUCCESS.DELETE_PRODUCT })

  }catch(err){
    adminLogger.error(`Delete Product Error: ${err.message}`);
    res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
}

// get products
exports.getProducts=async(req,res)=>{
  try{
const page=parseInt(req.query.page) || 1;
const limit=parseInt(req.query.limit) || 10;
const  skip=(page-1)*limit
adminLogger.info(`Fetching products - Page: ${page}, Limit: ${limit}`);
const total=await Product.countDocuments();
const products=await Product.find({},{_id:0,_v:0})
.skip(skip)
.limit(limit);
  adminLogger.info(`Successfully fetched ${products.length} products`);
return res.status(200).json({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  products
})
  }catch(err){
    adminLogger.error(`Get Paginated Products Error: ${err.message}`);
    return res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
}

