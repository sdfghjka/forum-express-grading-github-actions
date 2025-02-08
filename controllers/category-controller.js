const { Category } = require("../models");
const categoryController = {
  getCategories: (req, res, next) => {
    return Promise.all([
      Category.findAll({ raw: true }),
      req.params.id ? Category.findByPk(req.params.id, { raw: true }) : null,
    ])
      .then(([categories, category]) => {
        res.render("admin/categories", {
          categories,
          category,
        });
      })
      .catch((err) => next(err));
  },
  postCategory: (req, res, next) => {
    const { name } = req.body;
    if (!name) throw new Error("Category name is required!");
    Category.create({
      name,
    })
      .then(() => {
        req.flash("success_messages", "新增類別成功!");
        res.redirect("/admin/categories");
      })
      .catch((error) => {
        next(error);
      });
  },
  putCategory: (req, res, next) => {
    const { name } = req.body;
    if (!name) throw new Error("Category name is required!");
    return Category.findByPk(req.params.id)
      .then((category) => {
        if (!category) throw new Error("Category doesn't exist!");
        return category.update({ name });
      })
      .then(() => res.redirect("/admin/categories"))
      .catch((err) => next(err));
  },
  deleteCategory: (req, res, next) => {
    const { id } = req.params;
    Category.findByPk(id)
    .then((Category)=>{
      if (!Category) throw new Error("Category didn't exist!");
      return Category.destroy();
    })
    .then(()=>{
      req.flash("success_messages", "刪除類別成功!")
      return res.redirect("/admin/categories");
    })
    .catch((error)=>{
      next(error)
    })
  },
};
module.exports = categoryController;
