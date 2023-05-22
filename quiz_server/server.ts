import express from "express";
import * as fs from "fs";
import axios from "axios";
import { MongoClient } from "mongodb";

// Import interface types:
import {
  Player,
  Blacklist,
  FavoriteList,
  Characters,
  Doc,
  Gender,
  Quotes,
  qDoc,
  Movie,
  Movies,
  ApiData,
  GameVariables,
} from "./types";

// Import all helper functions:
import { findCharacterInfoForFavoriteList } from "./helperFunctions/findCharacterInfo";
import { countCharactersQuotes } from "./helperFunctions/countCharacterQuotes";
import { getRandomNumber } from "./helperFunctions/randomNumberGenerator";
import { addArrayElements, addCharacterPhotoArrayElements, addMoviePhotoArrayElements } from "./helperFunctions/combineArrayElements";
import { getHighScores } from "./helperFunctions/getHighScores";

// Set up mongo client:
const uri =
  "mongodb+srv://server:server123@rikcluster.mh2n1dx.mongodb.net/?retryWrites=true&w=majority";
const app = express();
import session from "express-session";
let client = new MongoClient(uri);

// Declare session interface:
declare module "express-session" {
  export interface SessionData {
    user: Player;
  }
}

// Set up express app:
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

// Variable used to store data for each quiz round:
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

// These three variables below are used to save all quotes, movies, and characters from API while server is running so that we only have to do an API call once when server is started
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

// Variable used to store both api and game data during quiz:
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
  gameType: "",
  headerTitle: "",
  userCorrectFeedback: {
    rightMovie: 0,
    rightCharacter: 0,
  },
  qHighscores: [],
  sHighscores: [],
};

//check if user is logged in
const checkSession = (req: any, res: any, next: any): void => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

// main function
const getApiData = async (): Promise<void> => {
  //authorization token
  let token: string = "UOzmNvWKAN3QRiFrHRIh";
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

  // function which is called each round to get a new quote and characters and movies data:
  const main = async (req: any): Promise<void> => {
    // get users blacklisted quotes
    let blacklistedQuotes: string[] = [];
    let quoteId: number = 0;
    let characterId: string = "";

    // if user has no blacklist quotes we can skip this step
    if (
      req.session.user.blacklisted != null &&
      req.session.user.blacklisted != undefined
    ) {
      for (const character of req.session.user.blacklisted) {
        for (let i = 0; i < character.blacklistQuotes.length; i++) {
          blacklistedQuotes.push(character.blacklistQuotes[i]);
        }
      }

      //find random quote
      // check if random quote is not in the users blacklist
      let notInBlacklist: boolean = false;

      while (!notInBlacklist) {
        quoteId = getRandomNumber(0, quotes.docs.length);
        apiData.quote = quotes.docs[quoteId];
        if (blacklistedQuotes.indexOf(apiData.quote.dialog) == -1) {
          notInBlacklist = true;
        }
      }
      characterId = apiData.quote.character;
    } else {
      quoteId = getRandomNumber(0, quotes.docs.length);
      apiData.quote = quotes.docs[quoteId];
      characterId = apiData.quote.character;
    }

    // find the character that matches the random quote
    for (let i = 0; i < characters.docs.length; i++) {
      if (characterId == characters.docs[i]._id) {
        apiData.charactersArray[0] = characters.docs[i];
        apiData.correctCharacterName = characters.docs[i].name;
        break;
      }
    }

    // check if the character from the random quote is not MINOR_CHARACTER, else get new quote and character
    while (apiData.charactersArray[0].name == "MINOR_CHARACTER") {
      if (
        req.session.user.blacklisted != null &&
        req.session.user.blacklisted != undefined
      ) {
        let notInBlacklist: boolean = false;

        while (!notInBlacklist) {
          quoteId = getRandomNumber(0, quotes.docs.length);
          apiData.quote = quotes.docs[quoteId];
          if (blacklistedQuotes.indexOf(apiData.quote.dialog) == -1) {
            notInBlacklist = true;
          }
        }
      } else {
        quoteId = getRandomNumber(0, quotes.docs.length);
        apiData.quote = quotes.docs[quoteId];
      }

      characterId = apiData.quote.character;

      for (let i = 0; i < characters.docs.length; i++) {
        if (characterId == characters.docs[i]._id) {
          apiData.charactersArray[0] = characters.docs[i];
          apiData.correctCharacterName = characters.docs[i].name;
          break;
        }
      }
    }

    //find correct movie from where that quote came from
    let movieId: string = apiData.quote.movie;
    for (let i = 0; i < movies.docs.length; i++) {
      if (movieId == movies.docs[i]._id) {
        apiData.moviesArray[0] = movies.docs[i];
        apiData.correctMovieName = movies.docs[i].name;
        break;
      }
    }

    //getting random wrong movies
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
    //get random number to be used on quiz.ejs for displaying selections
    gameData.randomNumberMovie = getRandomNumber(1, 4);
    gameData.randomNumberCharacter = getRandomNumber(1, 3);

    //get random wrong characters function
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

    // make sure the two random wrong characters are not the same
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

  // array for app.get routes:
  let routes = [
    "/quiz",
    "/sudden_death",
    "/highscore",
    "/index",
    "/favorites",
    "/blacklist",
    "/account",
    "/printAllQuotes"
  ];

  app.get(routes, checkSession, async (req, res) => {
    let parsedUrl = new URL(`http://localhost:${app.get("port")}${req.url}`);
    let path = parsedUrl.pathname;

    // check which app.get route was requested:
    switch (path) {
      case "/quiz":
        // reset game variables when user starts a new game:
        gameData.score = 0;
        gameData.gameCounter = 1;
        gameData.userCorrectFeedback.rightMovie = 0;
        gameData.userCorrectFeedback.rightCharacter = 0;

        main(req);
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

        main(req);
        gameData.headerTitle = "Sudden Death";
        gameData.gameType = "sudden_death";
        res.render("quiz", { dataGame: gameData, dataApi: apiData });
        break;
      case "/highscore":
        await getHighScores();
        gameData.headerTitle = "Highscore";
        gameData.gameType = "quiz";
        res.render("highscore", {
          dataGame: gameData,
          dataApi: apiData,
        });
        break;
      case "/index":
        gameData.headerTitle = "LOTR Quiz";
        gameData.gameType = "";
        res.render("index", {
          dataGame: gameData,
          dataApi: apiData,
          userData: req.session.user,
          alertstate: null,
        });
        break;
      case "/favorites":
        if (
          req.session.user!.favorites == undefined ||
          req.session.user!.favorites.length == 0
        ) {
          let alert: string =
            "You have no favorite quotes yet! <br>Maybe you should play another round";
          gameData.headerTitle = "LOTR Quiz";
          gameData.gameType = "";
          res.render("index", {
            dataGame: gameData,
            dataApi: apiData,
            userData: req.session.user,
            alertstate: alert,
          });
        } else {
          for (let i = 0; i < req.session.user!.favorites!.length; i++) {
            req.session.user!.favorites![i].characterInfo =
              findCharacterInfoForFavoriteList(
                req.session.user!.favorites![i].characterName
              );
            req.session.user!.favorites![i].quotesAmount =
              countCharactersQuotes(
                req.session.user!.favorites![i].characterInfo
              );
          }
          gameData.headerTitle = "Favorites";
          gameData.gameType = "";
          res.render("favorites", {
            dataGame: gameData,
            dataApi: apiData,
            userData: req.session.user,
            favoriteData: req.session.user!.favorites,
          });
        }
        break;
      case "/blacklist":
        if (
          req.session.user?.blacklisted == null ||
          req.session.user?.blacklisted.length == 0
        ) {
          let alert: string =
            "You have no blacklisted quotes yet!<br><span>Maybe you should play another round</span>";
          gameData.headerTitle = "LOTR Quiz";
          gameData.gameType = "";
          res.render("index", {
            dataGame: gameData,
            dataApi: apiData,
            userData: req.session.user,
            alertstate: alert,
          });
        } else {
          gameData.headerTitle = "Blacklist";
          gameData.gameType = "";
          res.render("blacklist", {
            dataGame: gameData,
            dataApi: apiData,
            userData: req.session.user,
            blacklistData: req.session.user!.blacklisted,
          });
        }
        break;
      case "/account":
        gameData.headerTitle = "Account";
        gameData.gameType = "";
        let BtnBool: boolean = true;
        res.render("account", {
          dataGame: gameData,
          dataApi: apiData,
          userData: req.session.user,
          BtnBool: BtnBool,
          error: "",
          success: "",
        });
        break;
      case "/printAllQuotes":
        let allQuotes: string[] = [];
        let counter: number = 0;
        // Put all of users favorite quotes into an array:
        for (let i = 0; i < req.session.user!.favorites!.length; i++) {
          for (let k = 0; k < req.session.user!.favorites![i].favoriteQuotes.length; k++) {
            allQuotes[counter] = `${req.session.user!.favorites![i].characterName}\n`;
            allQuotes[counter] += req.session.user!.favorites![i].favoriteQuotes[k];
            counter++;
          }
        }
        // Add newline after each array element:
        let printText: string = allQuotes.join("\n");
        const filename = "All_Quotes.txt";
        // Print to txt file:
        try {
          fs.writeFileSync(filename, printText, { flag: "a" });
          res.download(__dirname);

        } catch (error: any) {
          console.log(error.message);
        }
        finally {
          res.redirect("/favorites");
        }

      default:
        break;
    }
  });

  app.get("/printQuotes/:characterId", (req, res) => {
    let characterId = parseInt(req.params.characterId);
    let characterName: string = req.session.user!.favorites![characterId].characterName;
    let characterQuotes: string[] = [...req.session.user!.favorites![characterId].favoriteQuotes];

    characterQuotes.forEach((element, index) => {
      characterQuotes[index] = `${index + 1}. ${characterQuotes[index]}`;
    })
    // Add newline after each array element:
    let printText: string = `${characterName}\n`;
    printText += characterQuotes.join(`\n`);

    const filename = `${characterName}_Quotes.txt`;
    // Print to txt file:
    try {
      fs.writeFileSync(filename, printText, { flag: "a" });
      res.download(__dirname);

    } catch (error: any) {
      console.log(error.message);
    }
    finally {
      res.redirect("/favorites");
    }
  });

  app.get("/", (req, res) => {
    gameData.gameType = "";
    let loggedIn: boolean;
    if (req.session.user) {
      loggedIn = true;
    } else {
      loggedIn = false;
    }

    res.render("landing", { loggedIn: loggedIn });
  });

  app.get("/login", (req, res) => {
    gameData.gameType = "";
    res.render("login", { error: "" });
  });

  app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      res.redirect("/");
    });
  });

  app.get("/create", (req, res) => {
    gameData.gameType = "";
    res.render("create", { error: "" });
  });

  //create new User
  app.post("/create", async (req, res) => {
    // check if name only contains letters or numbers:
    if (
      req.body.name.match(
        /^[\w\áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]+$/
      )
    ) {
      let NewUser: Player = {
        name: req.body.name,
        ww: req.body.ww,
      };

      try {
        // check to see if the name already has an account:
        await client.connect();
        const nameLookUp = await client
          .db("LOTR")
          .collection("users")
          .findOne({ name: req.body.name });

        // if name does not have account then make a new account:
        if (nameLookUp == undefined || nameLookUp == null) {
          const result = await client
            .db("LOTR")
            .collection("users")
            .insertOne(NewUser);

          res.redirect("/login");
        }
        // if name already has an account then show error message:
        else {
          res.render("create", {
            error: `"${req.body.name}" already has an account.`,
          });
          return;
        }
      } catch (error: any) {
        console.log(error.message);
      } finally {
        await client.close();
      }
    }
    // if name contains something else than numbers or letters then show error message:
    else {
      res.render("create", {
        error: `"${req.body.name}" is not a valid username.<br>Username can only include letters or numbers.`,
      });
      return;
    }
  });

  //login
  app.post("/login", async (req, res) => {
    // check if name only contains letters or numbers:
    if (
      req.body.name.match(
        /^[\w\áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]+$/
      )
    ) {
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
          res.redirect("/index");
        }
        // if profile not found show an error:
        else {
          res.render("login", { error: `Username or password was incorrect.` });
          return;
        }
      } catch (error: any) {
        console.log(error.message);
      } finally {
        await client.close();
      }
    }
    // if name contains something else than numbers or letters then show error message:
    else {
      res.render("login", {
        error: `"${req.body.name}" is not a valid username.`,
      });
      return;
    }
  });

  // Account page - change password or change name
  app.post("/account", async (req, res) => {
    // check if name only contains letters or numbers:
    if (
      req.body.newname.match(
        /^[\w\áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ]+$/
      ) ||
      (req.body.newname == "" && req.body.wwOld != "" && req.body.wwNew != "")
    ) {
      try {
        await client.connect();
        const oldName = req.session.user?.name;
        const userId = req.session.user?._id;
        const newName = req.body.newname;

        // CHANGE NAME
        if (req.body.nameSubmit) {
          if (
            req.body.newname != null &&
            !req.body.newname != undefined &&
            req.body.newname != ""
          ) {
            // check to see if the name already exists:
            const nameLookUp = await client
              .db("LOTR")
              .collection("users")
              .findOne({ name: newName });

            // if name is not taken then a namechange is possible:
            if (nameLookUp == undefined || nameLookUp == null) {
              const result = await client
                .db("LOTR")
                .collection("users")
                .updateOne(
                  { name: oldName },
                  { $set: { name: req.body.newname } }
                );

              req.session.user!.name = req.body.newname;

              res.render("account", {
                error: "",
                success: "Name changed!",
                userData: req.session.user,
              });
              return;
            }

            // if name already exists then show error message:
            else {
              res.render("account", {
                success: "",
                error: `Name "${req.body.newname}" already exists.`,
                userData: req.session.user,
              });
              return;
            }
          }
        }

        // CHANGE PASSWORD
        if (req.body.passwordSubmit) {
          if (
            req.body.wwNew != null &&
            req.body.wwNew != undefined &&
            req.body.wwNew != ""
          ) {
            // Check if the old password is valid
            if ((await req.session.user?.ww) == req.body.wwOld) {
              const result = await client
                .db("LOTR")
                .collection("users")
                .updateOne({ name: oldName }, { $set: { ww: req.body.wwNew } });
              req.session.user!.ww = req.body.wwNew;
              res.render("account", {
                error: "",
                success: `Password changed!`,
                userData: req.session.user,
              });

              return;
            } else {
              // if old password is not valid then show error message
              res.render("account", {
                success: "",
                error: `Your current password was wrong!`,
                userData: req.session.user,
              });
              return;
            }
          }
        }
      } catch (error: any) {
        console.log(error.message);
      } finally {
        await client.close();
      }
    }
    // if name contains something else than numbers or letters then show error message:
    else {
      res.render("account", {
        success: "",
        error: `Name "${req.body.newname}" is not valid.<br>Username can only include letters or numbers.`,
        userData: req.session.user,
      });
      return;
    }
  });

  // NOTE: quiz scores are saved into the databank from the app.post highscore
  app.post("/quiz", async (req, res) => {
    gameData.headerTitle = "10 Rounds";
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

    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName &&
      gameData.gameCounter != 0
    ) {
      gameData.score++;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // Both correct
    } else if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer != apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = -1;
      // Only Movie correct
    } else if (
      gameData.userMovieAnswer != apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score = gameData.score + 0.5;
      gameData.userCorrectFeedback.rightMovie = -1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // Only character correct
    } else if (gameData.gameCounter != 0) {
      gameData.userCorrectFeedback.rightMovie = -1;
      gameData.userCorrectFeedback.rightCharacter = -1;
      // Both wrong
    }

    // Set the game round +1
    gameData.gameCounter++;

    // call main function to get new quote, characters, and movies
    main(req);

    res.render("quiz", { dataGame: gameData, dataApi: apiData });
  });

  app.post("/sudden_death", async (req, res) => {
    gameData.headerTitle = "Sudden Death";
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
    if (
      gameData.userMovieAnswer == apiData.correctMovieName &&
      gameData.userCharacterAnswer == apiData.correctCharacterName
    ) {
      gameData.score++;
      gameData.userCorrectFeedback.rightMovie = 1;
      gameData.userCorrectFeedback.rightCharacter = 1;
      // Both are correct

      // Set the game round +1
      gameData.gameCounter++;

      // call main function to get new quote, characters, and movies:
      main(req);

      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    } else if (gameData.gameCounter != 0) {
      // Both are wrong.

      // if game score is higher than the users highest score, or if it is the users first time playing then save the score in the databank:
      if (
        req.session.user!.sdscore! < gameData.score ||
        req.session.user!.sdscore! == undefined ||
        req.session.user!.sdscore! == null
      )
        try {
          await client.connect();
          req.session.user!.sdscore = gameData.score;

          let result = await client
            .db("LOTR")
            .collection("users")
            .updateOne(
              { name: req.session.user?.name },
              { $set: { sdscore: gameData.score } }
            );
          await getHighScores();
          res.render("highscore", { dataGame: gameData, dataApi: apiData });
        } catch (error: any) {
          console.log(error.message);
        } finally {
          await client.close();
        }
      // if the score is less than the users highest score, go directly to highscore page:
      else {
        await getHighScores();
        res.render("highscore", { dataGame: gameData, dataApi: apiData });
      }
    }
    // this is where a new sudden_death quiz starts if retrying from highscore page:
    else {
      // Set the game round +1
      gameData.gameCounter++;

      // call main function to get new quote, characters, and movies
      main(req);

      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    }
  });

  app.post("/highscore", async (req, res) => {
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

    // after the 10 rounds are played, if the score is higher than the users highest score, or if it is the users first time playing then save the score in the databank:
    if (
      req.session.user!.qscore! < gameData.score ||
      req.session.user!.qscore! == undefined ||
      req.session.user!.qscore! == null
    ) {
      try {
        await client.connect();
        req.session.user!.qscore = gameData.score;

        let result = await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { qscore: gameData.score } }
          );
        await getHighScores();
        res.render("highscore", { dataGame: gameData, dataApi: apiData });
      } catch (error: any) {
        console.log(error.message);
      } finally {
        await client.close();
      }
    }
    // if the score is less than the users highest score, go directly to highscore page
    else {
      await getHighScores();
      res.render("highscore", { dataGame: gameData, dataApi: apiData });
    }
  });

  //remove from favorites
  app.get(
    "/deleteFavoriteQuote/:characterIndex/:quoteindex",
    checkSession,
    async (req, res) => {
      try {
        let characterIndex: number = parseInt(req.params.characterIndex);
        let quoteIndex: number = parseInt(req.params.quoteindex);
        req.session.user!.favorites![characterIndex].favoriteQuotes.splice(
          quoteIndex,
          1
        );
        if (
          req.session.user!.favorites![characterIndex].favoriteQuotes.length ==
          0
        ) {
          req.session.user!.favorites!.splice(characterIndex, 1);
        }

        await client.connect();

        //remove from list on database
        await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user!.name },
            { $set: { favorites: req.session.user!.favorites } }
          );
      } catch (error: any) {
        console.log(error.message);
      } finally {
        await client.close();
        if (req.session.user!.favorites!.length == 0) {
          res.redirect("/index");
        } else {
          res.redirect("/favorites");
        }
      }
    }
  );

  //remove from blacklist
  app.get(
    "/deleteBlacklistQuote/:characterIndex/:quoteindex",
    checkSession,
    async (req, res) => {
      try {
        let characterIndex: number = parseInt(req.params.characterIndex);
        let quoteIndex: number = parseInt(req.params.quoteindex);
        req.session.user!.blacklisted![characterIndex].blacklistQuotes.splice(
          quoteIndex,
          1
        );
        req.session.user!.blacklisted![characterIndex].reason.splice(
          quoteIndex,
          1
        );
        if (
          req.session.user!.blacklisted![characterIndex].blacklistQuotes
            .length == 0
        ) {
          req.session.user!.blacklisted?.splice(characterIndex, 1);
        }

        await client.connect();

        //remove from list on database
        await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { blacklisted: req.session.user?.blacklisted } }
          );
      } catch (error: any) {
        console.log(error.message);
      } finally {
        await client.close();
        if (req.session.user!.blacklisted!.length == 0) {
          res.redirect("/index");
        } else {
          res.redirect("/blacklist");
        }
      }
    }
  );

  //edit reason
  app.post(
    "/editReason/:characterIndex/:quoteIndex",
    checkSession,
    async (req, res) => {
      try {
        let characterIndex = parseInt(req.params.characterIndex);
        let quoteIndex = parseInt(req.params.quoteIndex);
        let newReason: string = req.body.editreason;
        req.session.user!.blacklisted![characterIndex].reason[quoteIndex] =
          newReason;
        await client.connect();
        await client
          .db("LOTR")
          .collection("users")
          .updateOne(
            { name: req.session.user?.name },
            { $set: { blacklisted: req.session.user!.blacklisted } }
          );
      } catch (error: any) {
        console.log(error.message);
      } finally {
        await client.close();
        res.redirect("/blacklist");
      }
    }
  );

  app.post("/addToFavorites", async (req, res) => {
    let name: string = apiData.correctCharacterName;
    let quote: string = apiData.quote.dialog;

    try {
      //connect
      await client.connect();

      if (req.session.user!.favorites == undefined) {
        req.session.user!.favorites = [];
      }
      // check if character already has quotes in the favorite list:
      let result = req.session.user!.favorites?.find(
        (character) => character.characterName == name
      );
      if (result == undefined) {
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
          },
          quotesAmount: 0,
        };

        newFavoriteListData.favoriteQuotes.push(quote);
        newFavoriteListData.characterInfo =
          findCharacterInfoForFavoriteList(name);
        newFavoriteListData.quotesAmount = countCharactersQuotes(
          newFavoriteListData.characterInfo
        );
        req.session.user!.favorites!.push(newFavoriteListData);
      } else {
        let index: number = req.session.user!.favorites!.findIndex(
          (character) => character.characterName == name
        );
        req.session.user!.favorites![index].favoriteQuotes.push(quote);
      }

      //add to database
      await client
        .db("LOTR")
        .collection("users")
        .updateOne(
          { name: req.session.user!.name },
          { $set: { favorites: req.session.user!.favorites } }
        );
    } catch (error: any) {
      console.log(error.message);
    } finally {
      await client.close();
      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    }
  });

  app.post("/addToBlacklist", async (req, res) => {
    let name: string = apiData.correctCharacterName;
    let quote: string = apiData.quote.dialog;
    let reason: string = req.body.blacklistreason;
    try {
      //connect
      await client.connect();

      if (req.session.user!.blacklisted! == undefined) {
        req.session.user!.blacklisted = [];
      }

      let result = req.session.user!.blacklisted?.find(
        (character) => character.characterName == name
      );
      if (result == undefined) {
        let newBlacklistData: Blacklist = {
          characterName: name,
          blacklistQuotes: [],
          reason: [],
        };

        newBlacklistData.blacklistQuotes.push(quote);
        newBlacklistData.reason.push(reason);
        req.session.user!.blacklisted!.push(newBlacklistData);
      } else {
        let index: number = req.session.user!.blacklisted!.findIndex(
          (character) => character.characterName == name
        );
        req.session.user!.blacklisted![index].blacklistQuotes.push(quote);
        let reasonIndex: number = req.session.user!.blacklisted[
          index
        ].blacklistQuotes.findIndex(
          (characterQuote) => characterQuote == quote
        );
        req.session.user!.blacklisted![index].reason[reasonIndex] == reason;
      }

      //add to database
      await client
        .db("LOTR")
        .collection("users")
        .updateOne(
          { name: req.session.user!.name },
          { $set: { blacklisted: req.session.user!.blacklisted } }
        );
    } catch (error: any) {
      console.log(error.message);
    } finally {
      await client.close();
      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    }
  });

  app.post("/addToFavorites", async (req, res) => {
    let name = apiData.correctCharacterName;
    let quote = apiData.quote.dialog;
    try {
      //connect
      await client.connect();

      // check if character already has quotes in the favorite list:
      let characterIndex: number = -1;
      for (
        let i = 0;
        i < req.session.user!.favorites!.length && characterIndex == -1;
        i++
      ) {
        if (req.session.user!.favorites![i].characterName == name) {
          characterIndex = i;
        }
      }

      // if character already has quotes in the favorite list, then add the new quote to the characters list of favorite list quotes:
      if (characterIndex != -1) {
        req.session.user!.favorites![characterIndex].favoriteQuotes.push(quote);
      }
      // if character is not in the favorite list yet then add a new favorite list object to the users favorite list array:
      else {
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
          },
          quotesAmount: 0,
        };

        newFavoriteListData.favoriteQuotes.push(quote);
        newFavoriteListData.characterInfo =
          findCharacterInfoForFavoriteList(name);
        newFavoriteListData.quotesAmount = countCharactersQuotes(
          newFavoriteListData.characterInfo
        );
        req.session.user!.favorites!.push(newFavoriteListData);
      }

      //add to database
      await client
        .db("LOTR")
        .collection("users")
        .updateOne(
          { name: req.session.user!.name },
          { $set: { favorites: req.session.user!.favorites } }
        );
    } catch (error: any) {
      console.log(error.message);
    } finally {
      await client.close();
      res.render("quiz", { dataGame: gameData, dataApi: apiData });
    }
  });

  app.listen(app.get("port"), () =>
    console.log("[server] http://localhost:" + app.get("port"))
  );
};

getApiData();

export {characters, quotes, gameData, client};
