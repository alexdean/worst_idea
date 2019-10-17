import React, { useContext, useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  useCollection,
  useCollectionOnce,
  useDocument
} from "react-firebase-hooks/firestore";
import firebase from "./firebase";
import Cookies from "js-cookie";

const db = firebase.firestore();

const Projector = () => {
  // App state
  const [gameId, setGameId] = useState(null); // stores the gameId for the session
  const [questions, setQuestions] = useState([]); // stores all the questions for the gamdId
  const [stage, setStage] = useState(null); // joining | question-open | question-closed | question-results | finished
  const [leaderId, setLeaderId] = useState(null); // stores uid of the 'emperor'
  const [currentQuestionId, setCurrentQuestionId] = useState(null); // stores current question index
  const [summary, setSummary] = useState({ total: 0 }); // store the current question's summary
  const [prevActivePlayerCount, setPrevActivePlayerCount] = useState(0);
  const [activePlayerCount, setActivePlayerCount] = useState(0);

  // Establishes and maintains Firebase auth. We can check the value of 'user' and do things based on that;
  const [user, initializing, error] = useAuthState(firebase.auth());

  // Get and store questions for the gameId stored in the above state...
  const [questionsValue, questionsLoading, questionsError] = useCollection(
    gameId &&
      user &&
      db
        .collection("games")
        .doc(gameId)
        .collection("questions")
  );

  // Subscribe to game document
  const [gameValue, gameLoading, gameError] = useDocument(
    gameId && user && db.collection("games").doc(gameId)
  );

  // Get and store the available collection Games...
  const [gamesValue, gamesLoading, gamesError] = useCollectionOnce(
    db.collection("games")
  );

  // Get and store the leader's answer
  const [leaderAnswer, leaderAnswerLoading, leaderAnswerError] = useDocument(
    gameId &&
      user &&
      leaderId &&
      db
        .collection("games")
        .doc(gameId)
        .collection("player_answers")
        .doc(leaderId)
  );

  // Get and store the leader player doc
  const [leader, leaderLoading, leaderError] = useDocument(
    gameId &&
      user &&
      leaderId &&
      db
        .collection("games")
        .doc(gameId)
        .collection("players")
        .doc(leaderId)
  );

  const logout = () => {
    let c = confirm("You can't rejoin after the game starts. Really quit?");
    if (c) {
      firebase.auth().signOut();
      Cookies.remove("_worst_idea_game_id");
    }
  };

  // stuf for cleanup
  const reset = () => {
    firebase.auth().signOut();
    Cookies.remove("_worst_idea_game_id");
  };

  const login = game => {
    console.log("Authenticating...");
    // todo: validate name input
    firebase
      .auth()
      .signInAnonymously()
      .catch(error => {
        console.error("Firebase auth error", error);
      })
      .then(u => {
        let gameId = game.data().title;
        setGameId(gameId);
        Cookies.set("_worst_idea_game_id", gameId);
      });
  };

  // useEffect runs whenever the values listed in their last argument (the array) change.
  // In this case, whenever {user} updates
  useEffect(() => {
    console.log("user udpated");
    // console.log("user updated: ", user);
    let c = Cookies.get("_worst_idea_game_id");
    // console.log("Game id cookie: ", c);
    c && setGameId(c);
  }, [user]);

  // Runs when leader doc updates
  useEffect(() => {
    console.log("leader updated");
    if (leader) {
    }
  }, [leader]);

  // Runs when leader doc updates
  useEffect(() => {
    if (leaderAnswer) {
      console.log("leader answer updated");
      // setLeaderAnswer(_leaderAnswer);
    }
    if (leaderAnswerError) {
      console.error("leader answer error");
    }
  }, [leaderAnswer, leaderAnswerError]);

  // Runs whenever the game doc updates
  useEffect(() => {
    console.log("gameValue updated: ", gameValue);
    if (gameValue) {
      // Update the current question id
      setStage(gameValue.data().current_stage);
      setCurrentQuestionId(gameValue.data().active_question_id);
      setLeaderId(gameValue.data().leader_player_id);
      gameValue.data().summary && summarize(gameValue.data().summary);

      if (gameValue.data().active_player_count != activePlayerCount) {
        setPrevActivePlayerCount(activePlayerCount);
        setActivePlayerCount(gameValue.data().active_player_count);
      }
    }
  }, [gameValue]);

  // Runs when the questions collection is updated
  useEffect(() => {
    questionsValue &&
      setQuestions(questionsValue.docs.map((question, i) => question.data()));
  }, [questionsValue]);

  // Calculate the total answer count for the active question
  const summarize = data => {
    const reducer = (accumulator, current) => accumulator + current;
    let totalAnswerCount = Object.values(data).reduce(reducer);
    setSummary({
      total: totalAnswerCount
    });
  };

  // Renders ––––––––––––––––––––

  // If auth'd...
  if (user) {
    return (
      <div className="text-gray-200 h-screen flex justify-center items-center">
        <div className="p-20 w-full">
          {stage === "joining" && (
            <div className="w-full">
              <div className="">
                <div className="font-thin" style={{ fontSize: "8rem" }}>
                  The Emperor/Empress of Bad Ideas
                </div>
                {stage === "joining" && (
                  <span
                    className="font-bold text-indigo-500"
                    style={{
                      fontSize: "7rem"
                    }}
                  >
                    go.ted.com/badideas
                  </span>
                )}
              </div>
            </div>
          )}

          {(stage === "question-open" || stage === "question-closed") && (
            <div className="w-full">
              {currentQuestionId !== null && gameValue && (
                <div className="">
                  <div
                    className="font-bold mb-10 leading-tight"
                    style={{
                      fontSize: "7rem"
                    }}
                  >
                    {questions[currentQuestionId].question}
                  </div>
                  <div className="">
                    {questions[currentQuestionId].answers.map((answer, i) => {
                      let count = gameValue.data().summary
                        ? gameValue.data().summary[i]
                        : 0;
                      let percentage = Math.floor(
                        (count / summary.total) * 100
                      );
                      // console.log("count", count);
                      // console.log(summary.total);
                      return (
                        <div className="my-4" key={i}>
                          <div
                            onClick={e => onAnswerSelect(e, i)}
                            className={`answer text-lg inline-block w-full overflow-hidden rounded relative`}
                          >
                            <div
                              className="h-full absolute bg-indigo-900"
                              style={{ zIndex: 9, width: `${percentage}%` }}
                            ></div>
                            <div
                              className="p-6 text-5xl relative flex items-center justify-between"
                              style={{
                                zIndex: 10,
                                backgroundColor: "rgba(255,255,255,0.05)"
                                // backgroundImage: `linear-gradient(90deg, rgba(246,0,0,.5) 0%, rgba(246,0,0,.5) ${percentage}%, rgba(246,0,0,0) ${percentage}%)`
                              }}
                            >
                              <div className="">
                                {stage === "question-closed" &&
                                  leaderAnswer && (
                                    <span className="">
                                      {leaderAnswer.data().answer_id === i &&
                                        `👑 `}
                                    </span>
                                  )}
                                {answer}
                              </div>
                              <div className="text-4xl">
                                {count > 0 && `(${percentage}%)`}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {(stage === "question-results" || stage === "preparing") && (
            <div className="w-full text-center">
              <div
                className="font-bold"
                style={{
                  fontSize: "18rem"
                }}
              >
                {prevActivePlayerCount != 0 && (
                  <s className="mr-4 font-thin">{prevActivePlayerCount}</s>
                )}
                {activePlayerCount}
              </div>
              <div className="font-thin" style={{ fontSize: "6rem" }}>
                remaining
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 inset-x-0">
          <div className="p-3 flex justify-between items-center">
            <div className="">{stage && stage}</div>
            <div className="">
              <button className="opacity-50" onClick={logout}>
                Quit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user not defined, list available games. This the entrance to the player app.
  // All players will see this at the beginning of their experience.
  return (
    <div className="p-4 text-gray-200">
      {initializing && (
        <div>
          <p>Initializing User...</p>
        </div>
      )}
      {error && (
        <div>
          <p>Error: {error}</p>
        </div>
      )}

      <div className="font-bold mb-4 py-1 text-2xl">
        Choose a game to spectate
      </div>
      <div className="">
        {gamesValue &&
          gamesValue.docs.map((game, i) => {
            return (
              <div
                key={i}
                className="flex items-center justify-between w-full my-2"
              >
                <div className="">{game.data().title}</div>
                <button
                  className="bg-indigo-600 text-white p-2 px-6 rounded"
                  onClick={() => login(game)}
                >
                  Spectate
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Projector;
