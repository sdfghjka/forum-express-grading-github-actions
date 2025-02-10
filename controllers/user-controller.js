const bcrypt = require("bcryptjs");
const { where } = require("sequelize");
const { User, Restaurant, Comment, Favorite, Like } = require("../models");
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
    return User.findByPk(req.params.id, {
      include: [{ model: Comment, include: Restaurant }],
    })
      .then((user) => {
        if (!user) throw new Error("User didn't exist!");
        user = user.toJSON();
        console.log(user);
        user.commentedRestaurants =
          user.Comments &&
          user.Comments.reduce((acc, c) => {
            if (!acc.some((r) => r.id === c.restaurantId)) {
              acc.push(c.Restaurant);
            }
            return acc;
          }, []);
        res.render("users/profile", {
          user,
        });
      })
      .catch((err) => next(err));
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
  addFavorite: (req, res, next) => {
    const { restaurantId } = req.params;
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId,
        },
      }),
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!");
        if (favorite) throw new Error("You have favorited this restaurant!");

        return Favorite.create({
          userId: req.user.id,
          restaurantId,
        });
      })
      .then(() => res.redirect("back"))
      .catch((err) => next(err));
  },
  removeFavorite: (req, res, next) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId,
      },
    })
      .then((favorite) => {
        if (!favorite) throw new Error("You haven't favorited this restaurant");

        return favorite.destroy();
      })
      .then(() => res.redirect("back"))
      .catch((err) => next(err));
  },
  addLike: async (req, res, next) => {
    try {
      const { restaurantId } = req.params;
      const [like, restaurant] = await Promise.all([
        Like.findOne({ where: { userId: req.user.id, restaurantId } }),
        Restaurant.findByPk(restaurantId),
      ]);

      if (!restaurant) throw new Error("Restaurant didn't exist!");
      if (like) throw new Error("You have favorited this restaurant!");

      const newLike = await Like.create({
        userId: req.user.id,
        restaurantId,
      });

      console.log("Like created:", newLike); // Debug log
      return res.redirect("back");
    } catch (err) {
      next(err);
    }
  },

  removeLike: async (req, res, next) => {
    try {
      const { restaurantId } = req.params;
      const like = await Like.findOne({
        where: {
          userId: req.user.id,
          restaurantId,
        },
      });

      if (!like) throw new Error("You haven't favorited this restaurant");

      await like.destroy();
      console.log("Like removed:", restaurantId); // Debug log
      return res.redirect("back");
    } catch (err) {
      next(err);
    }
  },
  getTopUsers: (req, res, next) => {
    return User.findAll({
      include: [{ model: User, as: "Followers" }],
    })
      .then((users) => {
        users = users.map((user) => ({
          ...user.toJSON(),
          followerCount: user.Followers.length,
          isFollowed: req.user.Followings.some((f) => f.id === user.id),
        }));
        res.render("top-users", { users: users });
      })
      .catch((err) => next(err));
  },
};
module.exports = userController;
