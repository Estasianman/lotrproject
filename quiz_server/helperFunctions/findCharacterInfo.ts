import { characters } from "../server";
import { Doc, Gender } from "../types";

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
    if (characters.docs[i].name == nameToFind) {
      foundCharacterInfo = characters.docs[i];
      found = true;
    }
  }
  return foundCharacterInfo;
};

export { findCharacterInfoForFavoriteList }