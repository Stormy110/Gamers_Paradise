const { layout } = require('../utils');
const { User, Comment, Post, Game } = require("../models");


const member = async (req, res) => {
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
};

const createPost = async(req, res) => {
    const games = await Game.findAll()
    res.render("createForm", {
      locals: {
        games
      },
      ...layout,
    });
  };

const processPost = async (req, res) => {
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
};

const about = (req, res) => {
    res.render("members-about", {
      locals: {},
      ...layout,
    });
};

const contact = (req, res) => {
    res.render("members-contact", {
      locals: {},
      ...layout,
    });
};


const logout = (req, res) => {
    console.log('logging out...');
    req.session.destroy(() => {
        // After deleting session:
        res.redirect('/');
    });
};
module.exports = {
    member,
    createPost,
    processPost,
    about,
    contact,
    logout
}