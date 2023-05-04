import express from "express";
const axios = require("axios");
import { MongoClient } from "mongodb";
const uri =
  "mongodb+srv://server:server123@rikcluster.mh2n1dx.mongodb.net/?retryWrites=true&w=majority";
const app = express();
import session from "express-session";
let client = new MongoClient(uri);

declare module "express-session" {
  export interface SessionData {
    user: Player;
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("port", 3000);

app.use(
  session({
    name: "login",
    secret: "argew",
    resave: false,
    saveUninitialized: true,

    cookie: {
      maxAge: 6000000,
    },
  })
);

//player interface
interface Player {
  name: string;
  ww: string;
  qscore?: number;
  sdscore?: number;
  favorites?: FavoriteList[];
  blacklisted?: Blacklist[];
}

// Blacklist interface
interface Blacklist {
  characterName: string,
  blacklistQuotes: string[],
  reason: string[]
}

// FavoriteList interface
interface FavoriteList {
  characterName: string,
  favoriteQuotes: string[],
  characterInfo: Doc
}

//API character interface
export interface Characters {
  docs: Doc[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  pages: number;
}

export interface Doc {
  _id: string;
  height: string;
  race: string;
  gender?: Gender;
  birth: string;
  spouse: string;
  death: string;
  realm: string;
  hair: string;
  name: string;
  wikiUrl?: string;
}

export enum Gender {
  Empty = "",
  Female = "Female",
  GenderMale = "male",
  Male = "Male",
  Males = "Males",
  MostLikelyMale = "Most likely male",
  NaN = "NaN",
}

//API quote interfaces
export interface Quotes {
  docs: qDoc[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  pages: number;
}

export interface qDoc {
  _id: string;
  dialog: string;
  movie: Movie;
  character: string;
  id: string;
}

export enum Movie {
  The5Cd95395De30Eff6Ebccde5B = "5cd95395de30eff6ebccde5b",
  The5Cd95395De30Eff6Ebccde5D = "5cd95395de30eff6ebccde5d",
}

//API Movie interface
export interface Movies {
  docs: MovieDoc[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  pages: number;
}

export interface MovieDoc {
  _id: string;
  name: string;
  runtimeInMinutes: number;
  budgetInMillions: number;
  boxOfficeRevenueInMillions: number;
  academyAwardNominations: number;
  academyAwardWins: number;
  rottenTomatoesScore: number;
}

interface RandomFunction {
  (min: number, max: number): number;
}

interface CombineArrayElements {
  (arrayEmpty: any[], arrayToTransfer: any[]): void;
}

// interface to save data from the API
interface ApiData {
  quote: qDoc;
  charactersArray: Doc[];
  moviesArray: MovieDoc[];
  correctCharacterName: string;
  correctMovieName: string;
}

let apiData: ApiData = {
  quote: {
    _id: "",
    dialog: "",
    movie: Movie.The5Cd95395De30Eff6Ebccde5D,
    character: "",
    id: "",
  },
  charactersArray: [],
  moviesArray: [],
  correctCharacterName: "",
  correctMovieName: "",
};

let quotes: Quotes;
let movies: Movies;

let characters: Characters = {
  docs: [],
  total: 0,
  limit: 0,
  offset: 0,
  page: 0,
  pages: 0,
};

// main game variables used in the quiz
interface GameVariables {
  movieArray: MovieDoc[];
  correctMovieName: string;
  characterArray: Doc[];
  correctCharacterName: string;
  userMovieAnswer: string;
  userCharacterAnswer: string;
  gameCounter: number;
  score: number;
  randomNumberMovie: number;
  randomNumberCharacter: number;
  moviePhotoArray: any[];
  characterPhotoArray: any[];
  previousQuizAnswers: string;
  gameType: string;
  headerTitle: string;
  userCorrectFeedback: {
    rightMovie: number;
    rightCharacter: number;
  };
}

let gameData: GameVariables = {
  movieArray: [],
  correctMovieName: "",
  characterArray: [],
  correctCharacterName: "",
  userMovieAnswer: "",
  userCharacterAnswer: "",
  gameCounter: 0,
  score: 0,
  randomNumberMovie: 0,
  randomNumberCharacter: 0,
  moviePhotoArray: [],
  characterPhotoArray: [],
  previousQuizAnswers: "",
  gameType: "",
  headerTitle: "",
  userCorrectFeedback: {
    rightMovie: 0,
    rightCharacter: 0,
  },
};

 // find Doc (character info) to put in favorite list data
 const findCharacterInfoForFavoriteList = (nameToFind: string): Doc => {

  let foundCharacterInfo: Doc = {
            _id: "",
            height: "",
            race: "",
            gender: Gender.Empty,
            birth: "",
            spouse: "",
            death: "",
            realm: "",
            hair: "",
            name: "",
            wikiUrl: "",
  };

  let found: boolean = false;

  for (let i = 0; i < characters.docs.length && !found; i++) {
    
      if (characters.docs[i].name == nameToFind){
        foundCharacterInfo = characters.docs[i];
        found = true;
      }
  }
  return foundCharacterInfo;
}

//add to blacklist
let addtoBlacklist = async (req: any,res: any,name: string, quote: string, reason: string) => {
  try {
    //connect
    await client.connect();

    // check if character already has quotes in the blacklist:
    let characterIndex: number = -1;
    for (let i = 0; i < req.session.user.blacklisted.length && characterIndex == -1; i++) {
      if (req.session.user.blacklisted[i].characterName == name){
        characterIndex = i;
      }
    }

    // if character already has quotes in the blacklist, then add the new quote to the characters list of blacklist quotes:
    if (characterIndex != -1){
      req.session.user.blacklisted[characterIndex].blacklistQuotes.push(quote);
      req.session.user.blacklisted[characterIndex].reason.push(reason);

    }
    // if character is not in the blacklist yet then add a new blacklist object to the users blacklist array:
    else{
      let newBlacklistData: Blacklist = {
        characterName: name,
        blacklistQuotes: [],
        reason: []
      }

      newBlacklistData.blacklistQuotes.push(quote);
      newBlacklistData.reason.push(reason);
      req.session.user.blacklisted.push(newBlacklistData);
    }

    //add to database
    await client
      .db("LOTR").collection("users").updateOne({ name: req.session.user.name },{ blacklisted: req.session.user.blacklisted });
  } catch (exc:any) {
    console.log(exc.message);
  } finally {
    await client.close();
  }
};

//add to favorites
let addtoFavorites = async (req: any, name: string, quote: string, characterinfo: Doc) => {
  try {
    //connect
    await client.connect();

    // check if character already has quotes in the favorite list:
    let characterIndex: number = -1;
    for (let i = 0; i < req.session.user.favorites.length && characterIndex == -1; i++) {
      if (req.session.user.favorites[i].characterName == name){
        characterIndex = i;
      }
    }

    // if character already has quotes in the favorite list, then add the new quote to the characters list of favorite list quotes:
    if (characterIndex != -1){
      req.session.user.favorites[characterIndex].favoriteQuotes.push(quote);

    }
    // if character is not in the favorite list yet then add a new favorite list object to the users favorite list array:
    else{
      let newFavoriteListData: FavoriteList = {
        characterName: name,
        favoriteQuotes: [],
        characterInfo: {
              _id: "",
              height: "",
              race: "",
              gender: Gender.Empty,
              birth: "",
              spouse: "",
              death: "",
              realm: "",
              hair: "",
              name: "",
              wikiUrl: "",
        }
      }

      newFavoriteListData.favoriteQuotes.push(quote);
      newFavoriteListData.characterInfo = findCharacterInfoForFavoriteList(name);
      req.session.user.favorites.push(newFavoriteListData);
    }

    //add to database
    await client
      .db("LOTR")
      .collection("users")
      .updateOne(
        { name: req.session.user.name },
        { favorites: req.session.user.favorites }
      );
  } catch (exc) {
    console.log(exc);
  } finally {
    await client.close();
  }
};

//check if user is logged in
let checkSession = (req: any, res: any, next: any) => {
  console.log(req.session.user);
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

//main function
const getApiData = async (): Promise<void> => {
  //authorization token
  let token: string = "XfiSnDQochu1YXhRpuz5";
  //authorization header
  const auth = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    //get quotes from api
    let result = await axios.get("https://the-one-api.dev/v2/quote", auth);
    quotes = result.data;

    //get characters from api
    result = await axios.get("https://the-one-api.dev/v2/character", auth);
    characters = result.data;

    //get movies from api
    result = await axios.get("https://the-one-api.dev/v2/movie", auth);
    movies = result.data;
  } catch (error: any) {
    console.log(`${error.message}: ${error.response.data}`);
    return;
  }

  //random number generator
  const getRandomNumber: RandomFunction = (min, max) =>
    Math.floor(Math.random() * (max - min) + min);

  // get movie photo url function
  const getMoviePhotos = (name: string): string => {
    let photoSource: string = "";

    name = name.replace(/ /g, "_");
    switch (name) {
      case "The_Unexpected_Journey":
        photoSource = "/images/an-unexpected-journey.jpg";
        break;
      case "The_Desolation_of_Smaug":
        photoSource = "/images/the-desolation-of-smaug.jpg";
        break;
      case "The_Battle_of_the_Five_Armies":
        photoSource = "/images/battle-of-five-armies.jpg";
        break;
      case "The_Fellowship_of_the_Ring":
        photoSource = "/images/fellowship.jpg";
        break;
      case "The_Two_Towers":
        photoSource = "/images/two-towers.jpg";
        break;
      case "The_Return_of_the_King":
        photoSource = "/images/return-of-the-king.jpg";
        break;
      default:
        break;
    }
    return photoSource;
  };

  // put character and movie info data into gameData array
  const addArrayElements: CombineArrayElements = (
    arrayEmpty,
    arrayToTransfer
  ) => {
    for (let i = 0; i < 3; i++) {
      arrayEmpty[i] = arrayToTransfer[i];
    }
  };

  // put character photo url's into gameData array
  const addCharacterPhotoArrayElements: CombineArrayElements = (
    arrayEmpty,
    characterArray
  ) => {
    for (let i = 0; i < 3; i++) {
      let name: string = "";

      if (characterArray[i].name == "Gothmog (Lieutenant of Morgul)") {
        arrayEmpty[i] = `/images/characters/Gothmog.jpg`;
      } else if (characterArray[i].name == "Haldir (Haladin)") {
        arrayEmpty[i] = `/images/characters/Haldir.jpg`;
      } else {
        name = characterArray[i].name.replace(/ /g, "_");
        arrayEmpty[i] = `/images/characters/${name}.jpg`;
      }
    }
  };

  // put movie photo url's into gameData array
  const addMoviePhotoArrayElements: CombineArrayElements = (
    arrayEmpty,
    MovieArray
  ) => {
    for (let i = 0; i < 3; i++) {
      arrayEmpty[i] = getMoviePhotos(MovieArray[i].name);
    }
  };

  const main = async (): Promise<void> => {
    //find random quote and character from that quote
    let quoteId: number = 0;
    let characterId: string = "";

    quoteId = getRandomNumber(0, quotes.docs.length);
    apiData.quote = quotes.docs[quoteId];
    characterId = apiData.quote.character;

    for (let i = 0; i < characters.docs.length; i++) {
      if (characterId == characters.docs[i]._id) {
        apiData.charactersArray[0] = characters.docs[i];
        apiData.correctCharacterName = characters.docs[i].name;
        break;
      }
    }

    // check if the character from the random quote is not MINOR_CHARACTER, else get new quote and character
    while (apiData.charactersArray[0].name == "MINOR_CHARACTER") {
      quoteId = getRandomNumber(0, quotes.docs.length);
      apiData.quote = quotes.docs[quoteId];
      characterId = apiData.quote.character;

      for (let i = 0; i < characters.docs.length; i++) {
        if (characterId == characters.docs[i]._id) {
          apiData.charactersArray[0] = characters.docs[i];
          apiData.correctCharacterName = characters.docs[i].name;
          break;
        }
      }
    }

    //find correct movie
    let movieId: string = apiData.quote.movie;
    for (let i = 0; i < movies.docs.length; i++) {
      if (movieId == movies.docs[i]._id) {
        apiData.moviesArray[0] = movies.docs[i];
        apiData.correctMovieName = movies.docs[i].name;
        break;
      }
    }

    //getting wrong movies
    do {
      apiData.moviesArray[1] =
        movies.docs[getRandomNumber(2, movies.docs.length)];
      apiData.moviesArray[2] =
        movies.docs[getRandomNumber(2, movies.docs.length)];
    } while (
      apiData.moviesArray[1] == apiData.moviesArray[0] ||
      apiData.moviesArray[2] == apiData.moviesArray[0] ||
      apiData.moviesArray[1] == apiData.moviesArray[2]
    );

    // put correct movie and character names into gameData
    gameData.correctMovieName = apiData.correctMovieName;
    gameData.correctCharacterName = apiData.correctCharacterName;
    gameData.randomNumberMovie = getRandomNumber(1, 4);
    gameData.randomNumberCharacter = getRandomNumber(1, 3);

    //get wrong characters function
    const getWrongCharacters = (array: Doc): Doc => {
      let hasQuotes: boolean = false;
      let allQuotes: qDoc[] = quotes.docs;

      do {
        hasQuotes = false;
        array = characters.docs[getRandomNumber(0, characters.docs.length)];

        //check if character has quotes in the API. Otherwise get a different character
        for (let j = 0; j < allQuotes.length && hasQuotes == false; j++) {
          if (array._id == allQuotes[j].character) {
            hasQuotes = true;
          }
        }
      } while (
        !hasQuotes ||
        array.name == apiData.charactersArray[0].name ||
        array.name == "MINOR_CHARACTER" ||
        array.name == "User:Technobliterator/Showcase"
      );

      return array;
    };

    // Call getWrongCharacters function
    apiData.charactersArray[1] = getWrongCharacters(apiData.charactersArray[1]);
    apiData.charactersArray[2] = getWrongCharacters(apiData.charactersArray[2]);

    while (apiData.charactersArray[1] == apiData.charactersArray[2]) {
      apiData.charactersArray[1] = getWrongCharacters(
        apiData.charactersArray[1]
      );
    }

    // Put character and movie data into gameData arrays
    addCharacterPhotoArrayElements(
      gameData.characterPhotoArray,
      apiData.charactersArray
    );
    addMoviePhotoArrayElements(gameData.moviePhotoArray, apiData.moviesArray);

    addArrayElements(gameData.movieArray, apiData.moviesArray);
    addArrayElements(gameData.characterArray, apiData.charactersArray);
  };
  main();

  // array for app.get routes:
  let routes = [
    "/quiz",
    "/sudden_death",
    "/highscore",
    "/index",
    "/favorites",
    "/blacklist",
    "/account",
  ];

  app.get(routes, checkSession, (req, res) => {
    let parsedUrl = new URL(`http://localhost:${app.get("port")}${req.url}`);
    let path = parsedUrl.pathname;
    console.log(path);
    // check which app.get route was requested:
    switch (path) {
      case "/quiz":
        // reset game variables when user starts a new game:
        gameData.score = 0;
        gameData.gameCounter = 1;
        gameData.userCorrectFeedback.rightMovie = 0;
        gameData.userCorrectFeedback.rightCharacter = 0;

        main();
        gameData.headerTitle = "10 Rounds";
        gameData.gameType = "quiz";
        res.render("quiz", { dataGame: gameData, dataApi: apiData });
        break;
      case "/sudden_death":
        // reset game variables when user starts a new game:
        gameData.score = 0;
        gameData.gameCounter = 1;
        gameData.userCorrectFeedback.rightMovie = 0;
        gameData.userCorrectFeedback.rightCharacter = 0;

        main();
        gameData.headerTitle = "Sudden Death";
        gameData.gameType = "sudden_death";
        res.render("quiz", { dataGame: gameData, dataApi: apiData });
        break;
      case "/highscore":
        gameData.headerTitle = "Highscore";
        gameData.gameType = "quiz";
        res.render("highscore", {
          dataGame: gameData,
          dataApi: apiData
        });
        break;
      case "/index":
        gameData.headerTitle = "LOTR Quiz";
        gameData.gameType = "";
        res.render("index", { dataGame: gameData, dataApi: apiData });
        break;
      case "/favorites":

        // variable here under is to test the favorites page, the data is meant to mimic the data which would come out of the databank

        let fakeUserData: FavoriteList[] = 
          [{
            characterName: "Gandalf",
            favoriteQuotes: ["All we have to decide is what to do with the time that is given us", "This is no place for a Hobbit!"],
            characterInfo: {
              _id: "",
              height: "",
              race: "",
              gender: Gender.Empty,
              birth: "",
              spouse: "",
              death: "",
              realm: "",
              hair: "",
              name: "",
              wikiUrl: "",
            }
          },
          {
            characterName: "Samwise Gamgee",
            favoriteQuotes: ["You don't mean that. You can't leave.", "He took it. He must have."],
            characterInfo: {
              _id: "",
              height: "",
              race: "",
              gender: Gender.Empty,
              birth: "",
              spouse: "",
              death: "",
              realm: "",
              hair: "",
              name: "",
              wikiUrl: "",
            }
          }];

        for (let i = 0; i < fakeUserData.length; i++) {

          fakeUserData[i].characterInfo = findCharacterInfoForFavoriteList(fakeUserData[i].characterName);
        }

        gameData.headerTitle = "Favorites";
        gameData.gameType = "";
        res.render("favorites", { dataGame: gameData, dataApi: apiData, favoriteData: fakeUserData });
        break;
      case "/blacklist":
        gameData.headerTitle = "Blacklist";
        gameData.gameType = "";
        res.render("blacklist", { dataGame: gameData, dataApi: apiData });
        break;
      case "/account":
        gameData.headerTitle = "Account";
        gameData.gameType = "";
        res.render("account", { dataGame: gameData, dataApi: apiData });
        break;

      default:
        break;
    }
  });

  app.get("/landing", (req, res) => {
    gameData.gameType = "";
    res.render("landing");
  });

  app.get("/login", (req, res) => {
    gameData.gameType = "";
    res.render("login");
  });

  app.get("/create", (req, res) => {
    gameData.gameType = "";
    res.render("create");
  });

  //create new User
  app.post("/create", async (req, res) => {
    let NewUser: Player = {
      name: req.body.name,
      ww: req.body.ww,
    };

    try {
      await client.connect();
      const result = await client
        .db("LOTR")
        .collection("users")
        .insertOne(NewUser);
    } catch (exc) {
      console.log(exc);
    } finally {
      await client.close();
    }
    res.redirect("/login");
  });

  //login
  app.post("/login", async (req, res) => {
    try {
      await client.connect();
      let profile: Player = {
        name: req.body.name,
        ww: req.body.ww,
      };
      let result: Player | null = await client
        .db("LOTR")
        .collection("users")
        .findOne<Player>({ name: profile.name, ww: profile.ww });
      if (result) {
        req.session.user = result;
        req.session.save();
      }
    } catch (exc) {
      console.log(exc);
    } finally {
      await client.close();
    }
    res.redirect("/index");
  });

  app.post("/quiz", async (req, res) => {
    gameData.userCorrectFeedback.rightMovie = 0;
    gameData.userCorrectFeedback.rightCharacter = 0;
    // get user/player answers from quiz
    gameData.userMovieAnswer = req.body.checkboxMovie;
    gameData.userCharacterAnswer = req.body.checkboxCharacter;

    // if one of the questions was not answered then change variable from undefined to an empty string
    if (gameData.userMovieAnswer == undefined) {
      gameData.userMovieAnswer = "";
    }
    if (gameData.userCharacterAnswer == undefined) {
      gameData.userCharacterAnswer = "";
    }

    // check if user/player has answered questions correctly
    gameData.previousQuizAnswers = "";
    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score++;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // gameData.previousQuizAnswers = `Correct! Movie was:&nbsp; <span id="answers-span">  ${gameData.correctMovieName}</span>.&nbsp; Character was:&nbsp; <span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
    } else if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer != apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = -1;
      // gameData.previousQuizAnswers = `You guessed the movie right!&nbsp; Movie was:&nbsp; <span id="answers-span">  ${gameData.correctMovieName}</span>.&nbsp; The correct character was:&nbsp; <span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
    } else if (
      gameData.userMovieAnswer != apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
      gameData.userCorrectFeedback.rightMovie = -1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // gameData.previousQuizAnswers = `You guessed the character right!&nbsp; The correct movie was:&nbsp; <span id="answers-span">  ${gameData.correctMovieName}</span>.&nbsp; Character was:&nbsp;<span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
    } else if (gameData.gameCounter != 0) {
      gameData.userCorrectFeedback.rightMovie = -1;
      gameData.userCorrectFeedback.rightCharacter = -1;
      // gameData.previousQuizAnswers = `Both are wrong.&nbsp; The correct movie was:&nbsp; <span id="answers-span">  ${gameData.correctMovieName}</span>.&nbsp;  The correct character was:&nbsp; <span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
    }

    // Set the game round +1
    gameData.gameCounter++;

    // call main function to get new quote, characters, and movies
    main();

    res.render("quiz", { dataGame: gameData, dataApi: apiData });
  });

  app.post("/sudden_death", async (req, res) => {
    gameData.userCorrectFeedback.rightMovie = 0;
    gameData.userCorrectFeedback.rightCharacter = 0;
    // get user/player answers from quiz
    gameData.userMovieAnswer = req.body.checkboxMovie;
    gameData.userCharacterAnswer = req.body.checkboxCharacter;

    // if one of the questions was not answered then change variable from undefined to an empty string
    if (gameData.userMovieAnswer == undefined) {
      gameData.userMovieAnswer = "";
    }
    if (gameData.userCharacterAnswer == undefined) {
      gameData.userCharacterAnswer = "";
    }

    // check if user/player has answered questions correctly
    gameData.previousQuizAnswers = "";
    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score++;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // gameData.previousQuizAnswers = `Correct!&nbsp; Movie was:&nbsp; <span id="answers-span">  ${gameData.correctMovieName}</span>.&nbsp; Character was:&nbsp; <span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
      // Set the game round +1
      gameData.gameCounter++;

      // call main function to get new quote, characters, and movies
      main();

      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    } else if (gameData.gameCounter != 0) {
      // gameData.previousQuizAnswers = `Both are wrong.&nbsp;  The correct movie was:&nbsp; <span id="answers-span">  ${gameData.correctMovieName}</span>.&nbsp;  The correct character was:&nbsp; <span id="answers-span">  ${gameData.correctCharacterName}</span>.`;
      if (req.session.user!.sdscore! >= gameData.score)
        try {
          await client.connect();
          req.session.user!.sdscore = gameData.score;

          let result = await client
            .db("LOTR")
            .collection("users")
            .updateOne(
              { name: req.session.user?.name },
              { $set: { qscore: req.session.user?.sdscore } }
            );
          res.render("highscore", {
            dataGame: gameData,
            dataApi: apiData
          });
        } catch (exc) {
          console.log(exc);
        } finally {
          await client.close;
        }
    } else {
      // Set the game round +1
      gameData.gameCounter++;

      // call main function to get new quote, characters, and movies
      main();

      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    }
  });

  app.post("/highscore", (req, res) => {
    gameData.userMovieAnswer = req.body.checkboxMovie;
    gameData.userCharacterAnswer = req.body.checkboxCharacter;
    if (gameData.userMovieAnswer == undefined) {
      gameData.userMovieAnswer = "";
    }
    if (gameData.userCharacterAnswer == undefined) {
      gameData.userCharacterAnswer = "";
    }
    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score++;
    } else if (
      gameData.userMovieAnswer == apiData.correctMovieName ||
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
    }
    res.render("highscore", {
      dataGame: gameData,
      dataApi: apiData
    });
  });

  app.listen(app.get("port"), () =>
    console.log("[server] http://localhost:" + app.get("port") + "/index")
  );
};

getApiData();
export { };
