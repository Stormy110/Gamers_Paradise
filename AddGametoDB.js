const { Games } = require("./models");

//API
//"https://api.rawg.io/api/games?=name%2Cbackground_image%2Crating"

const axios = require("axios");

// let url = "https://api.rawg.io/api/games?=name%2Cbackground_image%2Crating";

// async function GetFirstPage() {
//     let res = await axios.get(url);
//     //   console.log(res);
// for (i = 0; i < 20; i++) {
// let gameResults = res.data.results[i].name;
// let image = res.data.results[i].background_image;
// //   let title = gameResults;
// console.log(`Game Title: ${gameResults}`);
// console.log(`Game Title: ${image}`);
// }
// }
// GetFirstPage();

async function GetPages() {
  // 10 Pages at a Time as of Right Now
  // 24,568 Pages in Total

  for (p = 2; p < 11; p++) {
    let url2 = `https://api.rawg.io/api/games?=name%2Cbackground_image%2Crating&page=${p}`;
    let res = await axios.get(url2);
    //   console.log(res);
    for (i = 0; i < 20; i++) {
      // Game Title
      let name = res.data.results[i].name;
      console.log(`Game Title: ${name}`);
      // Game Image
      let image = res.data.results[i].background_image;
      console.log(image);
      // Game Platforms
      let platforms = res.data.results[i].platforms;
      for (let plat of platforms) {
        let system = plat.platform.name;
        console.log(system);
      }
      // Game Genres
      let genres = res.data.results[i].genres;
      for (let g of genres) {
        let genre = g.name;
        console.log(genre);
      }
    }
  }
}
GetPages();
