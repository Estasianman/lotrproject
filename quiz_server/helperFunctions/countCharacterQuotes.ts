import { quotes } from "../server";
import { Doc } from "../types";

// function to count how many quotes a character has in api:
const countCharactersQuotes = (character: Doc): number => {
  let counter: number = 0;
  for (let i = 0; i < quotes.docs.length; i++) {
    if (character._id == quotes.docs[i].character) {
      counter++;
    }
  }
  return counter;
};

export { countCharactersQuotes };