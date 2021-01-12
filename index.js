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
const { User, Comment, Post } = require("./models");
const { requireLogin, logout } = require("./auth");
const UPLOAD_URL = "/uploads/media/";
const multer = require("multer");
const upload = multer({ dest: "public" + UPLOAD_URL });

const { layout } = require("./utils");

const logger = morgan("dev");
const hostname = "127.0.0.1";
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

app.get("/", (req, res) => {
  res.render("home", {
    locals: {},
    ...layout,
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    locals: {},
    ...layout,
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    locals: {},
    ...layout,
  });
});

app.get("/signup", (req, res) => {
  res.render("signUpPage", {
    locals: {},
    ...layout,
  });
});

app.post("/signup", async (req, res) => {
  const { username, password, name, email } = req.body;
  if (username == "" || password == "") {
    // res.json(["Username or Password is Blank!"]);
    res.redirect("/errorsignup");
  } else {
    const hash = bcrypt.hashSync(password, 10); // auto salt!
    try {
      const newUser = await User.create({
        username,
        hash,
        name,
        email,
      });
      console.log(newUser);

      res.redirect("/login");
    } catch (e) {
      //res.send("username is taken");
      if (e.user === "SequelizeUniqueConstraintError") {
        console.log("Username is Taken. Try Again!");
        // res.json(["Username is Taken. Try Again!"]);
      }
      res.redirect("/takensignup");
    }
  }
});

app.get("/errorsignup", (req, res) => {
  res.render("errorSignUp", {
    locals: {
      error: "Username or Password is Blank!",
    },
    ...layout,
  });
});
app.get("/takensignup", (req, res) => {
  res.render("takenSignUp", {
    locals: {
      error: "Username Is Taken. Try Again!",
    },
    ...layout,
  });
});

app.get("/login", (req, res) => {
  res.render("loginPage", {
    locals: {},
    ...layout,
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // I need to check the database!
  // Is that a valid user?
  const user = await User.findOne({
    where: {
      username,
    },
  });
  if (user) {
    // Is that their password?
    //res.send('we have a user!');
    const isValid = bcrypt.compareSync(password, user.hash);
    if (isValid) {
      req.session.user = {
        username: user.username,
        // username
        id: user.id,
        // id
      };
      req.session.save(() => {
        res.redirect("/members");
        // res.send('that is totally right!');
      });
    } else {
      res.send("boooo wrong password!");
    }
  } else {
    res.send("No user with that name!");
  }
  //   res.render("loginPage", {
  //     locals: {},
  //   });
  // res.redirect('/members')
});

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
  const { username, id } = req.session.user;
  const posts = await Post.findAll({
    order: [["createdAt", "desc"]],
    include: [{
      model: Comment,
      attributes: ['content', 'createdAt'],
      include: User
    }],
    // include: [
    //   {
    //     model: User,
    //     attributes: [{ username }],
    //   },
    // ],
  });
  res.render("members", {
    locals: {
      username,
      posts,
      id,
    },
    ...layout,
  });
});

app.get("/members/create", requireLogin, (req, res) => {
  res.render("createForm", {
    locals: {},
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
    const { title, content } = req.body;
    let mediaPic = file ? UPLOAD_URL + file.filename : "";
    const post = await Post.create({
      userid: id,
      username,
      title,
      media: mediaPic,
      content,
    });
    res.redirect("/members");
  }
);

app.get('/post/:id/comment', requireLogin, async (req,res)=>{
  const { id } = req.params

  const post = await Post.findByPk(id);
  const users = await User.findAll({
    order: [
      ['name', 'asc']
    ]
  })

  res.render('add-comment', {
    locals: {
      post,
      users
    },
    ...layout
  });
});

app.post('/post/:id/comment', requireLogin, async (req, res) => {
  const post = req.params.id;
  const { content } = req.body;
  const { id } = req.session.user;

  const comment = await Comment.create({
      content,
      userid: id,
      postid: post
  });
  res.redirect('/members');
});

app.get("/members/profile/:id", requireLogin, async (req, res) => {
  const { id } = req.params;
  const member = await Post.findAll({
    where: {
      userid: id,
    },
    order: [["createdAt", "desc"]],
  });
  res.render("profile", {
    locals: {
      member,
    },
    ...layout,
  });
});

app.get("/logout", requireLogin, logout);

app.get("/unauthorized", (req, res) => {
  res.send(`You shall not pass</h1><br><a href="/"><button>Home</button></a>`);
});

//catch all if website doesn't
app.get("*", (req, res) => {
  res.status(404).send("<h1>Page not found</h1>");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
