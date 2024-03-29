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

const Player = () => {
  // App state
  const [gameId, setGameId] = useState(null); // stores the gameId for the session
  const [questions, setQuestions] = useState([]); // stores all the questions for the gamdId
  const [stage, setStage] = useState(null); // joining | question-open | question-closed | question-results | finished
  const [leaderId, setLeaderId] = useState(null); // stores uid of the 'emperor'
  const [currentQuestionId, setCurrentQuestionId] = useState(null); // stores current question index
  const [selectedAnswer, setSelectedAnswer] = useState(null); // holds player's currently selected answer index
  const [playerIsActive, setPlayerIsActive] = useState(false); // store player active state. False after an incorrect answer
  const [summary, setSummary] = useState({ total: 0 }); // store the current question's summary
  const [isLeader, setIsLeader] = useState(false); // store if the player is the current leader

  // App refs
  const nameRef = useRef(null); // reference to the name input

  // Establishes and maintains Firebase auth. We can check the value of 'user' and do things based on that
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

  // Subscribe to player document
  const [playerValue, playerLoading, playerError] = useDocument(
    gameId &&
      user &&
      db
        .collection("games")
        .doc(gameId)
        .collection("players")
        .doc(user.uid)
  );

  // Subscribe to game document
  const [gameValue, gameLoading, gameError] = useDocument(
    gameId && user && db.collection("games").doc(gameId)
  );

  // Get and store the available collection Games...
  const [gamesValue, gamesLoading, gamesError] = useCollection(
    db.collection("games").where("title", "==", "current")
  );

  const logout = () => {
    let c = confirm("You can't rejoin after the game starts. Really quit?");
    if (c) {
      firebase.auth().signOut();
      Cookies.remove("_worst_idea_game_id");
    }
  };

  const login = game => {
    console.log("name value: ", nameRef.current.value);
    if (
      nameRef.current.value != "" &&
      nameRef.current.value != null &&
      game.data().current_stage === "joining"
    ) {
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
          return db
            .collection("games")
            .doc(gameId)
            .collection("players")
            .doc(u.user.uid)
            .set({ is_active: true, name: nameRef.current.value });
        });
    } else alert("You need to pick a name.");
  };

  // useEffect runs whenever the values listed in their last argument (the array) change.
  // In this case, whenever {user} updates
  useEffect(() => {
    console.log("user updated: ", user);
    let c = Cookies.get("_worst_idea_game_id");
    console.log("Game id cookie: ", c);
    c && setGameId(c);
  }, [user]);

  // Runs when the player doc updates
  useEffect(() => {
    if (playerValue) {
      console.log("playerValue updated: ", playerValue.data());
      setPlayerIsActive(playerValue.data().is_active);
    }
    playerError && console.error("Error updating player", playerError);
  }, [playerValue, playerError]);

  // Runs whenever the game doc updates
  useEffect(() => {
    console.log("gameValue updated: ", gameValue);
    if (gameValue) {
      // Update the current question id
      let qid = currentQuestionId;
      console.log("question id: ", gameValue.data().active_question_id);
      setCurrentQuestionId(gameValue.data().active_question_id);
      setStage(gameValue.data().current_stage);
      setLeaderId(gameValue.data().leader_player_id);
      setIsLeader(gameValue.data().leader_player_id === user.uid);
      // If the current question changed, then reset the player's selected answer
      if (qid != gameValue.data().active_question_id) {
        setSelectedAnswer(null);
      }
      gameValue.data().summary && summarize(gameValue.data().summary);
    }
  }, [gameValue]);

  // Runs when the root collection of games is fetched
  useEffect(() => {
    console.log("gamesValue udpated: ", gamesValue);
    gamesValue &&
      gamesValue.docs.map((game, i) => {
        // console.log(game.data().title);
      });
  }, [gamesValue]);

  // Runs when the questions collection is updated
  useEffect(() => {
    questionsValue &&
      setQuestions(questionsValue.docs.map((question, i) => question.data()));
  }, [questionsValue]);

  // Respond to clisk on answer options
  const onAnswerSelect = (e, i) => {
    // let answerIndex = parseInt(e.target.attributes["data-value"].value);
    let answerIndex = i;
    // console.log("Clicked: ", answerIndex, user.uid);
    if (stage === "question-open" && playerIsActive) {
      setSelectedAnswer(answerIndex);
      return db
        .collection("games")
        .doc(gameId)
        .collection("player_answers")
        .doc(user.uid)
        .set({ answer_id: answerIndex });
    } else {
      return false;
    }
  };

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
      <div className="text-gray-200">
        <div className="">
          {stage === "joining" && (
            <div className="">
              <div
                className="inset-0 absolute opacity-50"
                style={{
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "50% 50%"
                  // backgroundImage:
                  // "url(https://media.giphy.com/media/tXL4FHPSnVJ0A/giphy.gif)"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center content-center text-white">
                <div className="text-center">
                  <div className="text-3xl font-bold px-8 leading-tight">
                    Hey {playerValue && playerValue.data().name}
                  </div>
                  <div className="my-5 text-md">
                    Hang on while other players join.
                  </div>
                </div>
              </div>
            </div>
          )}
          {stage === "preparing" && (
            <div className="absolute inset-0 flex items-center justify-center content-center text-white">
              <div className="text-center">
                <div className="text-3xl font-bold px-8 leading-tight">
                  We're about ready to start.
                </div>
                <div className="my-5"></div>
              </div>
            </div>
          )}

          {(stage === "question-open" || stage === "question-closed") &&
            playerIsActive &&
            questions.length > 0 &&
            currentQuestionId !== null && (
              <div className="p-8">
                <div className="text-xl leading-tight mb-6 text-center">
                  {questions[currentQuestionId].question}
                </div>
                <div className="">
                  {questions[currentQuestionId].answers.map((answer, i) => {
                    let count = gameValue.data().summary
                      ? gameValue.data().summary[i]
                      : 0;
                    let percentage = Math.floor((count / summary.total) * 100);
                    console.log("count", count);
                    console.log(summary.total);
                    return (
                      <div className="my-4" key={i}>
                        <div
                          onClick={e => onAnswerSelect(e, i)}
                          className={`answer text-lg rounded-full inline-block w-full overflow-hidden text-center ${
                            selectedAnswer == i
                              ? "bg-indigo-600"
                              : "bg-gray-800"
                          }`}
                        >
                          <div
                            className="p-3"
                            style={
                              {
                                // backgroundImage: `linear-gradient(90deg, rgba(246,246,246,.2) 0%, rgba(246,246,246,.2) ${percentage}%, rgba(246,246,246,0) ${percentage}%)`
                              }
                            }
                          >
                            {answer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center">
                  {stage === "question-closed" && (
                    <div className="">Answers are now locked in</div>
                  )}
                  {stage === "question-results" && (
                    <div className="">Results are in...</div>
                  )}
                </div>
              </div>
            )}
        </div>

        {stage === "question-results" && playerIsActive && (
          <div className="">
            <div
              className="inset-0 absolute opacity-50"
              style={{
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "50% 50%"
                // backgroundImage:
                // "url(https://media.giphy.com/media/tXL4FHPSnVJ0A/giphy.gif)"
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center content-center text-white">
              <div className="text-center">
                <div className="text-3xl font-bold px-8 leading-tight">
                  You survived 🥳
                </div>
                <div className="my-5 text-md"></div>
              </div>
            </div>
          </div>
        )}
        {!playerIsActive && (
          <div className="">
            <div
              className="inset-0 absolute opacity-50"
              style={{
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "50% 50%"
                // backgroundImage:
                // "url(https://media.giphy.com/media/tXL4FHPSnVJ0A/giphy.gif)"
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center content-center text-white bg-red-700">
              <div className="text-center">
                <div className="text-3xl font-bold px-8 leading-tight">
                  You're eliminated 🙁
                </div>
                <div className="my-5 text-md"></div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bottom-0 inset-x-0 fixed">
          <div className="flex items-center justify-between p-4">
            <div className="">
              {playerValue && (
                <div className="">
                  <div className="font-bold">
                    {isLeader && <span className="">👑</span>}{" "}
                    {playerValue.data().name}
                  </div>
                  <div className="">
                    {playerValue.data().short_code &&
                      playerValue.data().short_code}
                  </div>
                  <div className="text-sm hidden">
                    {playerIsActive ? "In" : "Eliminated"}
                  </div>
                </div>
              )}
            </div>
            <div className="font-bold">
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
    <div className="p-4 text-gray-200 max-w-md mx-auto text-center">
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
      <div className="my-5">
        <div className="mb-4">
          <div className="font-bold text-2xl">Who are you?</div>
        </div>
        <input
          className="border-0 bg-gray-800 p-4 w-full text-lg text-center"
          placeholder="Enter your name"
          ref={nameRef}
          maxLength={30}
        />
        <div className="text-sm text-gray-600 my-2">Max 30 chars</div>
      </div>
      <div className="">
        {gamesValue &&
          gamesValue.docs.map((game, i) => {
            let locked = game.data().current_stage === "joining" ? false : true;
            return (
              true && (
                <div key={i} className="my-2">
                  <button
                    className={`text-lg p-4 block px-6 rounded w-full ${
                      locked
                        ? `bg-indigo-800 text-indigo-500`
                        : `font-bold bg-indigo-600 text-white`
                    }`}
                    onClick={() => login(game)}
                    disabled={locked ? true : false}
                  >
                    {locked ? `🔒 Locked` : `Join`}
                  </button>
                </div>
              )
            );
          })}
      </div>
    </div>
  );
};

export default Player;
