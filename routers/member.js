const express = require('express');
const router = express.Router();
const { layout } = require('../utils');
const { requireLogin, logout } = require("../auth");

router
    .get("/members-about", requireLogin, (req, res) => {
        res.render("members-about", {
        locals: {},
        ...layout,
        });
    })

    .get("/members-contact", requireLogin, (req, res) => {
        res.render("members-contact", {
          locals: {},
          ...layout,
        });
      })

      .get("/logout", requireLogin, logout);

module.exports = router;