const adminLogger=require('../utils/adminLogger')
const Category = require('./categoryModels');
const Messages = require("../utils/messages");
const { v4: uuidv4 } = require('uuid'); 

exports.addCategory = async (req, res) => {
  try {
    const { id, name, description } = req.body;
    adminLogger.debug(`Recevied The Category data:id=${id},name=${name}`)
    if (!id || !name) {
      adminLogger.warn("Add Category Failed:Missing ID or Name")
      return res.status(400).json({ message:Messages.ADMIN.ERROR.ADD_CATEGORY_REQUIRED });
    }

    const newCategory = new Category({ id, name, description });
    const saved = await newCategory.save();
    
    adminLogger.info(`Category added successfully: ${saved._id}`);
    return res.status(201).json({ message:Messages.ADMIN.SUCCESS.ADD_CATEGORY, category: saved });
  } catch (err) {
    adminLogger.error(`Add Category Error:${err.message}`);
    return res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
};

// update Category
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id?.trim();
    adminLogger.debug(`Incoming param ID: ${categoryId}`);

    if (!categoryId) {
      adminLogger.warn("Missing category ID in path parameters");
      return res.status(400).json({ message:Messages.ADMIN.ERROR.UPDATE_CATEGORY_REQUIED });
    }

    const { name, description } = req.body;

    if (!name || !description) {
      adminLogger.warn("Missing name or description in request body");
      return res.status(400).json({ message:Messages.ADMIN.ERROR.NAME_DESCRIPTION_REQUIRD });
    }

    const updated = await Category.findOneAndUpdate(
      { id: categoryId }, // Using custom 'id', not Mongo _id
      { name, description },
      { new: true }
    );

    if (!updated) {
      adminLogger.warn(`Category not found for ID: ${categoryId}`);
      return res.status(404).json({ message: Messages.ADMIN.ERROR.CATEGORY_NOT_FOUND });
    }

    adminLogger.info(`Category updated successfully: ID = ${categoryId}`);
    return res.status(200).json({
      message:Messages.ADMIN.SUCCESS.UPDATE_CATEGORY,
      category: updated
    });

  } catch (err) {
    adminLogger.error(`Update Category Error: ${err.message}`);
    return res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
};


// Delete Category
exports.deleteCategory=async(req,res)=>{
  try{
    const categoryId=req.params.id?.trim();
    adminLogger.debug(`Attempting to delete category with ID: ${categoryId}`);

    const deleted=await Category.findOneAndDelete({id:categoryId});
    if(!deleted){
      adminLogger.warn(`Category not found for deletion: ID=${categoryId}`);
      return res.status(404).json({message:Messages.ADMIN.ERROR.CATEGORY_NOT_FOUND});
    }
    adminLogger.info(`Category deleted successfully: ID=${categoryId}`);
    return res.json({message:Messages.ADMIN.SUCCESS.DELETE_CATEGORY})
  }catch(err){
   adminLogger.error(`Delete Category Error: ${err.message}`);
    return res.status(500).json({ message: Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
}

// Get Category
exports.getAllCategoris=async(req,res)=>{
  try{
const categories=await Category.find({},{_id:0,id:1,name:1,description:1})
const formated=categories.map(cat=>({
  categoryId:cat.id,
  name:cat.name,
  description:cat.description
}))
adminLogger.info("Fetched all categories successfully");
res.json(formated)
  }catch(err){
     adminLogger.error(`Get Categories Error: ${err.message}`);
    res.status(500).json({ message:Messages.ADMIN.ERROR.SERVER_ERROR, error: err.message });
  }
}

