const bcrypt = require("bcryptjs");
const db = require("../models");
const { where } = require("sequelize");
const User = db.User;
const Comment = db.Comment;
const Restaurant = db.Restaurant;
const { localFileHandler } = require("../helpers/file-helpers");
const { raw } = require("express");

const userController = {
  signUpPage: (req, res) => {
    res.render("signup");
  },
  signUp: (req, res, next) => {
    if (req.body.password !== req.body.passwordCheck)
      throw new Error("Passwords do not match!");

    User.findOne({ where: { email: req.body.email } })
      .then((user) => {
        if (user) throw new Error("Email already exists!");
        return bcrypt.hash(req.body.password, 10);
      })
      .then((hash) => {
        User.create({
          name: req.body.name,
          email: req.body.email,
          password: hash,
        });
      })
      .then(() => {
        req.flash("success_messages", "成功註冊帳號！");
        res.redirect("/signin");
      })
      .catch((err) => next(err));
  },
  signInPage: (req, res) => {
    res.render("signin");
  },
  signIn: (req, res) => {
    req.flash("success_messages", "成功登入！");
    res.redirect("/restaurants");
  },
  logout: (req, res) => {
    req.flash("success_messages", "登出成功！");
    req.logout();
    res.redirect("/signin");
  },
  getUser: (req, res, next) => {
    return Promise.all([
      Comment.findAndCountAll({
        where: { userId: 1 },
        include: [Restaurant],
        nest: true,
        raw: true,
      }),
      User.findByPk(req.params.id, {
        raw: true,
      }),
    ])
      .then(([comment, user]) => {
        return res.render("users/profile", { user, comment });
      })
      .catch((error) => {
        next(error);
      });
  },
  editUser: (req, res, next) => {
    return User.findByPk(req.params.id)
      .then((user) => {
        return res.render("users/edit", { user: user.toJSON() });
      })
      .catch((error) => {
        next(error);
      });
  },
  putUser: (req, res, next) => {
    const { name } = req.body;
    const { file } = req;
    if (req.user.id !== Number(req.params.id))
      throw new Error("You don't have permission");
    if (!name.trim()) throw new Error("User name is required!");
    return Promise.all([User.findByPk(req.params.id), localFileHandler(file)])
      .then(([user, filePath]) => {
        if (!user) throw new Error("User didn't exist!");

        return user.update({
          name,
          image: filePath || user.image,
        });
      })
      .then((user) => {
        req.flash("success_messages", "使用者資料編輯成功");
        res.redirect(`/users/${user.id}`);
      })
      .catch((err) => next(err));
  },
};
module.exports = userController;
