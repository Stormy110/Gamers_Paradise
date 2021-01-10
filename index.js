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
const bcrypt = require('bcryptjs');
const { User } = require('./models');

const {
  layout
} = require("./utils");

const logger = morgan("dev");
const hostname = "127.0.0.1";

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

app.get("/signup", (req, res) => {
  res.render("signUpPage", {
    locals: {},
    ...layout,
  });
});

app.post("/signup",async (req, res) => {
  const {
    username,
    password,
    name,
    email
  } = req.body;
  const hash = bcrypt.hashSync(password, 10); // auto salt!
  try {
    const newUser = await User.create({
      username,
      hash,
      name,
      email
    });
    console.log(newUser);

    res.redirect('/login');
  } catch (e) {
    res.send('username is taken');
  }
  // res.render("signUpPage", {
  //   locals: {},

  //   ...layout,
  // });
  // res.redirect('/members')
});

app.get("/login", (req, res) => {
  res.render("loginPage", {
    locals: {},
    ...layout,
  });
});

app.post("/login", async(req, res) => {
  const {
    username,
    password
  } = req.body;

  // I need to check the database!
  // Is that a valid user?
  const user = await User.findOne({
    where: {
      username
    }
  });
  if (user) {
    // Is that their password?
    //res.send('we have a user!');
    const isValid = bcrypt.compareSync(password, user.hash);
    if (isValid) {

      req.session.user = {
        username: user.username,
        // username
        id: user.id
        // id
      };
      req.session.save(() => {
        res.redirect('/members')
        // res.send('that is totally right!');
      });

    } else {
      res.send('boooo wrong password!');
    }

  } else {
    res.send('No user with that name!');
  }
  //   res.render("loginPage", {
  //     locals: {},
  //   });
  // res.redirect('/members')
});

app.get("/members", (req, res) => {
  const { username } = req.session.user
  res.render('members', {
    locals: {
      username
    


    },
    ...layout
  }) 

});

//catch all if website doesn't
app.get("*", (req, res) => {
  res.status(404).send("<h1>Page not found</h1>");
});

server.listen(3500, hostname, () => {
  console.log("Server running at localhost, port 3500");
});