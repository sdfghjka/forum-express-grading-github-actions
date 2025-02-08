const { Category } = require("../models");
const categoryController = {
  getCategories: (req, res, next) => {
    return Category.findAll({
      raw: true,
    })
      .then((categories) => res.render("admin/categories", { categories }))
      .catch((err) => next(err));
  },
  postCategory: (req, res) => {
    const { name } = req.body;
    if(!name) throw new Error("Category name is required!")
    Category.create({
      name,
    }).then(()=>{
      req.flash('success_messages','新增類別成功!')
      res.redirect("/admin/categories");
    }).catch((error)=>{
      next(error)
    })
  },
};
module.exports = categoryController;
