const express = require('express');
const router = express.Router();
const { requireLogin } = require("../auth");
const { memberController } = require('../controllers');
const UPLOAD_URL = "../uploads/media/";
const multer = require("multer");
const upload = multer({ dest: "public" + UPLOAD_URL });

router
  .get("/", requireLogin, memberController.member)

router
  .get("/create", requireLogin, )
  .post("/create", requireLogin, upload.single("media"), )
    


router
    .get("/about", requireLogin, memberController.about )

    .get("/contact", requireLogin, memberController.contact)

router
  .get('/logout', memberController.logout);


module.exports = router;