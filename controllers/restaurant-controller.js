const { Restaurant, Category } = require("../models");
const { getOffset, getPagination } = require("../helpers/pagination-helper");

const restController = {
  getRestaurants: (req, res) => {
    const categoryId = Number(req.query.categoryId) || "";
    const DEFAULT_LIMIT = 9;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || DEFAULT_LIMIT;
    const offset = getOffset(limit, page);

    return Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        where: {
          ...(categoryId ? { categoryId } : {}),
        },
        offset,
        limit,
        nest: true,
        raw: true,
      }),
      Category.findAll({ raw: true }),
    ]).then(([restaurants, categories]) => {
      const data = restaurants.rows.map((r) => ({
        ...r,
        description: r.description.substring(0, 50),
      }));
      return res.render("restaurants", {
        restaurants: data,
        categories,
        categoryId,
        pagination: getPagination(limit, page, restaurants.count),
      });
    });
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      nest: true,
    })
      .then((restaurant) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!");
        restaurant.increment({ viewCounts: 1 });
        res.render("restaurant", {
          restaurant: restaurant.toJSON(),
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
};
module.exports = restController;
