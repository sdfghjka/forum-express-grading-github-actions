const { Restaurant, Category, Comment, User, Favorite } = require("../../models");
const { getOffset, getPagination } = require("../../helpers/pagination-helper");
const restaurantServices = require('../../services/restaurant-services');

const restController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req,(err, data)=> err ? next(err): res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: "FavoritedUsers" },
        { model: User, as: "LikeUsers" },
      ],
    })
      .then((restaurant) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!");
        const isFavorited = restaurant.FavoritedUsers.some(
          (f) => f.id === req.user.id
        );
        const isLike = restaurant.LikeUsers.some((l) => l.id === req.user.id);
        restaurant.increment({ viewCounts: 1 });
        res.render("restaurant", {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLike,
        });
      })
      .catch((err) => next(err));
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      raw: true,
      nest: true,
    })
      .then((restaurant) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!");
        res.render("dashboard", { restaurant });
      })
      .catch((err) => next(err));
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [["createdAt", "DESC"]],
        include: [Category],
        raw: true,
        nest: true,
      }),
      Comment.findAll({
        limit: 10,
        order: [["createdAt", "DESC"]],
        include: [User, Restaurant],
        raw: true,
        nest: true,
      }),
    ])
      .then(([restaurants, comments]) => {
        res.render("feeds", {
          restaurants,
          comments,
        });
      })
      .catch((err) => next(err));
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: [{ model: User, as: "FavoritedUsers" }],
    })
      .then((restaurants) => {
        const result = restaurants
          .map((r) => ({
            ...r.toJSON(),
            favoriteCount: r.FavoritedUsers.length,
            isFavorited: req.user.FavoritedRestaurants.some(
              (fr) => fr.id === r.id
            ),
          }))
          .sort((a, b) => b.FavoritedUsers.length - a.FavoritedUsers.length)
          .slice(0, 10);
        return result;
      })
      .then((restaurants) => {
        return res.render("top-restaurants", { restaurants });
      })
      .catch((err)=>{
        next(err)
      })
  },
};
module.exports = restController;
