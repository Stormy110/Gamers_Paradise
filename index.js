require("dotenv").config();
const http = require("http");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const es6Renderer = require("express-es6-template-engine");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const app = express();
const server = http.createServer(app);
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, Comment, Post, Game } = require("./models");
const { requireLogin, logout } = require("./auth");
const UPLOAD_URL = "/uploads/media/";
const multer = require("multer");
const upload = multer({ dest: "public" + UPLOAD_URL });

const Sequelize = require("sequelize");

const { layout } = require("./utils");
const { homeRouter,userRouter } = require("./routers");

const logger = morgan("dev");
const hostname = "0.0.0.0";
const port = 3500;

//Register Middleware
app.use(logger);
app.use(helmet());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static("public"));

app.use(
  session({
    store: new FileStore(), // no options for now
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: true,
    rolling: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.engine("html", es6Renderer);
app.set("views", "templates");
app.set("view engine", "html");

const {
  errorController
}= require('./controllers')

app.use('/', homeRouter) //Has all home items
app.use('/user', userRouter) // Has SignUp, LogIn, and logOut

// app.get("/login", (req, res) => {
//   res.render("loginPage", {
//     locals: {},
//     ...layout,
//   });
// });

// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;
//   // const { loginid, password } = req.body;

//   // I need to check the database!
//   // Is that a valid user?

//   // let userEmail = loginid.includes("@") ? loginid : "";
//   // let userName = !loginid.includes("@") ? loginid : "" ;

//   let finalloginName = username.toLowerCase();
//   // let finalloginName = loginid.includes("@") ? loginid : loginid;
//   // console.log(finalloginName);

//   const user = await User.findOne({
//     where: {
//       [Op.or]: {
//         username: finalloginName,
//         email: finalloginName,
//       },
//     },
//   });
//   if (user) {
//     // Is that their password?
//     //res.send('we have a user!');
//     const isValid = bcrypt.compareSync(password, user.hash);
//     if (isValid) {
//       req.session.user = {
//         username: user.username,
//         // username
//         id: user.id,
//         // id
//         displayname: user.displayname,
//       };
//       req.session.save(() => {
//         res.redirect("/members");
//         // res.send('that is totally right!');
//       });
//     } else {
//       res.send("boooo wrong password!");
//     }
//   } else {
//     res.send("No user with that name!");
//   }
//   //   res.render("loginPage", {
//   //     locals: {},
//   //   });
//   // res.redirect('/members')
// });

// Put the requirelogin function on each route we need instead of having
// it do every route after the app.use. This way we can more specifically
// decide which route to requirelogin to enter

app.get("/members-about", requireLogin, (req, res) => {
  res.render("members-about", {
    locals: {},
    ...layout,
  });
});

app.get("/members-contact", requireLogin, (req, res) => {
  res.render("members-contact", {
    locals: {},
    ...layout,
  });
});

app.get("/members", requireLogin, async (req, res) => {
  const { displayname, username, id } = req.session.user;

  console.log(req.session.user);

  const posts = await Post.findAll({
    order: [["createdAt", "desc"]],
    include: [
      {
        model: Comment,
        attributes: ["content", "createdAt", "id"],
        include: User,
      },
      // {
      //   model: Game,
      //   attributes: ["title", "createdAt"],
      // }
    ]
  });

  for (let p of posts) {
    p.User = await User.findByPk(p.userid);
    p.Game = await Game.findByPk(p.gameid)
  }

  res.render("members", {
    locals: {
      displayname,
      username,
      posts,
      id,
    },
    ...layout,
  });
});

app.get("/members/create", requireLogin, async(req, res) => {
  const games = await Game.findAll()
  res.render("createForm", {
    locals: {
      games
    },
    ...layout,
  });
});
app.post(
  "/members/create",
  requireLogin,
  upload.single("media"),
  async (req, res) => {
    const { id, username } = req.session.user;
    const { file } = req;
    const { title, content, gameid } = req.body;
    let mediaPic = file ? UPLOAD_URL + file.filename : "";
    const post = await Post.create({
      userid: id,
      username,
      title,
      media: mediaPic,
      content,
      gameid
    });
    res.redirect("/members");
  }
);

app.get("/post/:id/comment", requireLogin, async (req, res) => {
  const { id } = req.params;

  const post = await Post.findByPk(id);
  const users = await User.findAll({
    order: [["name", "asc"]],
  });

  res.render("add-comment", {
    locals: {
      post,
      users,
    },
    ...layout,
  });
});

app.post("/post/:id/comment", requireLogin, async (req, res) => {
  const post = req.params.id;
  const { content } = req.body;
  const { id } = req.session.user;

  const comment = await Comment.create({
    content,
    userid: id,
    postid: post,
  });
  res.redirect("/members");
});

app.get("/members/profile/:id", requireLogin, async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);

  console.log("Error Before FindAll");
  const member = await Post.findAll({
    where: {
      userid: id,
    },
    order: [["createdAt", "desc"]],
    include: [
      {
        model: Comment,
        attributes: ["content", "createdAt"],
        include: User,
      },
      // {
      //   model: User,
      // },
    ],
  });
  for (let p of member) {
    // p.User = await User.findByPk(p.userid);
    p.Game = await Game.findByPk(p.gameid)
  }
  console.log(JSON.stringify(member, null, 4));
  res.render("profile", {
    locals: {
      member,
      user,
    },
    ...layout,
  });
});

app.get("/members/post/:id/edit", requireLogin, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByPk(id);
  res.render("createFormEdit", {
    locals: {
      post,
    },
    ...layout,
  });
});

app.post(
  "/members/post/:id/edit",
  requireLogin,
  upload.single("media"),
  async (req, res) => {
    const { id } = req.params;
    const { file } = req;
    console.log(id);
    const { title, content } = req.body;
    console.log(title);
    console.log(content);

    let data = {
      title,
      content,
    };
    // let mediaPic = file ? UPLOAD_URL + file.filename : "";

    if (file) {
      data["media"] = UPLOAD_URL + file.filename;
    }
    const updatedPost = await Post.update(data, {
      where: {
        id,
        userid: req.session.user.id,
      },
    });

    res.redirect("/members");
  }
);

app.get("/members/post/:id/delete", requireLogin, async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByPk(id);
  res.render("delete-post", {
    locals: {
      name: "Delete Post",
      post,
    },
    ...layout,
  });
});

app.post("/members/post/:id/delete", requireLogin, async (req, res) => {
  const { id } = req.params;
  const deletedPost = await Post.destroy({
    where: {
      id,
      userid: req.session.user.id,
    },
  });
  res.redirect("/members");
});

app.get("/members/comment/:id/edit", requireLogin, async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findByPk(id);
  const post = await Post.findByPk(comment.postid);
  const user = await User.findByPk(comment.userid);
  res.render("editComment", {
    locals: {
      comment,
      post,
      user,
    },
    ...layout,
  });
});

app.post("/members/comment/:id/edit", requireLogin, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const updatedComment = await Comment.update(
    {
      content,
    },
    {
      where: {
        id,
        userid: req.session.user.id,
      },
    }
  );

  res.redirect("/members");
});

app.get("/members/comment/:id/delete", requireLogin, async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findByPk(id);
  res.render("deleteComment", {
    locals: {
      comment,
    },
    ...layout,
  });
});

app.post("/members/comment/:id/delete", requireLogin, async (req, res) => {
  const { id } = req.params;
  const deletedComment = await Comment.destroy({
    where: {
      id,
      userid: req.session.user.id,
    },
  });
  res.redirect("/members");
});

app.get("/members/search", requireLogin, (req, res) => {
  res.render("search", {
    locals: {},
    ...layout,
  });
});

app.post("/members/search", requireLogin, async (req, res) => {
  const { searchContent } = req.body;

  try {
    if (searchContent) {
      const posts = await Post.findAll({
        where: Sequelize.where(
          Sequelize.fn(
            "concat",
            Sequelize.col("title") /*Sequelize.col("content")*/
          ),
          {
            [Op.iLike]: "%" + searchContent + "%",
          }
        ),

        include: [
          {
            model: Comment,
            attributes: ["content", "createdAt"],
            include: User,
          },
        ],
      });
      for (let p of posts) {
        p.User = await User.findByPk(p.userid);
        p.Game = await Game.findByPk(p.gameid)
      }
      res.render("search-results", {
        locals: {
          posts,
        },
        ...layout,
      });
    }
  } catch (err) {
    console.log(`SEARCH ERROR : ${err}`);
    res.redirect("/members");
  }
});

app.post("/members/game/search", requireLogin, async (req, res) => {
  const { searchStuff } = req.body;

  try {
    if (searchStuff) {
      const game = await Game.findOne({
        where: Sequelize.where(
          Sequelize.fn(
            "concat",
            Sequelize.col("title") /*Sequelize.col("content")*/
          ),
          {
            [Op.iLike]: "%" + searchStuff + "%",
          }
        ),
      });
      let gid = game.id;
      const posts = await Post.findAll({
        where: {
          gameid: gid,
        },
        include: [
          {
            model: Comment,
            attributes: ["content", "createdAt"],
            include: User,
          },
        ],
      })
      for (let p of posts) {
        p.User = await User.findByPk(p.userid);
        p.Game = await Game.findByPk(p.gameid)
      }
      res.render("search-results", {
        locals: {
          posts,
        },
        ...layout,
      });
    }
  } catch (err) {
    console.log(`SEARCH ERROR : ${err}`);
    res.redirect("/members");
  }
});

app.get('/members/game/:id', requireLogin, async (req,res)=>{
  const { id } = req.params;
  const game = await Game.findByPk(id);
  console.log(game.image)
  res.render('game-page', {
      locals: {
          game
      },
      ...layout
  })
});

//catch all if website doesn't
app.get("*", (req, res) => {
  res.status(404).send("<h1>Page not found</h1>");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
