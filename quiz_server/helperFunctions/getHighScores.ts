import { gameData, client } from "../server";

// function to get top 10 highscores from databank:
const getHighScores = async (): Promise<void> => {
    gameData.qHighscores.slice(0, gameData.qHighscores.length);
    gameData.sHighscores.slice(0, gameData.sHighscores.length);
    try {
        await client.connect();
        // first get the 10 round quiz top 10 scores:
        const data = await client
            .db("LOTR")
            .collection("users")
            .find({})
            .sort({ qscore: -1 })
            .limit(10);
        let qScores = await data.toArray();
        // loop through data and put element into gameData variable, make sure element is not empty:
        qScores.forEach((element, index) => {
            if (element.qscore != undefined) {
                gameData.qHighscores[index] = {
                    name: element.name,
                    score: element.qscore,
                };
            }
        });
        // then get sudden death top 10 scores:
        const data2 = await client
            .db("LOTR")
            .collection("users")
            .find({})
            .sort({ sdscore: -1 })
            .limit(10);
        let sScores = await data2.toArray();
        // loop through data and put element into gameData variable, make sure element is not empty:
        sScores.forEach((element, index) => {
            if (element.sdscore != undefined) {
                gameData.sHighscores[index] = {
                    name: element.name,
                    score: element.sdscore,
                };
            }
        });
    } catch (error: any) {
        console.log(error.message);
    } finally {
        await client.close();
    }
};

export { getHighScores };