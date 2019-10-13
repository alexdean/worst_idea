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

  // App refs
  const nameRef = useRef(null); // reference to the name input

  // Establishes and maintains Firebase auth. We can check the value of 'user' and do things based on that
  const [user, initializing, error] = useAuthState(firebase.auth());

  // Get and store questions for the gameId stored in the above state...
  const [questionsValue, questionsLoading, questionsError] = useCollectionOnce(
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
  const [gamesValue, gamesLoading, gamesError] = useCollectionOnce(
    db.collection("games").where("current_stage", "==", "joining")
  );

  const logout = () => {
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
        return db
          .collection("games")
          .doc(gameId)
          .collection("players")
          .doc(u.user.uid)
          .set({ is_active: true, name: nameRef.current.value });
      });
  };

  // useEffect runs whenever the values listed in the last argument change
  // In this case, whenever {user} updates
  useEffect(() => {
    let c = Cookies.get("_worst_idea_game_id");
    console.log("Game id cookie: ", c);
    c && setGameId(c);
  }, [user]);

  useEffect(() => {
    console.log("Player value: ", playerValue);
    playerValue && setPlayerIsActive(playerValue.data().is_active);
  }, [playerValue]);

  // Runs whenever the game document updates
  useEffect(() => {
    if (gameValue) {
      // Update the current question id
      console.log("question id: ", gameValue.data().active_question_id);
      setCurrentQuestionId(gameValue.data().active_question_id);
      setStage(gameValue.data().current_stage);
      setLeaderId(gameValue.data().leader_player_id);
      setSelectedAnswer(null);
    }
  }, [gameValue]);

  useEffect(() => {
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

  const onAnswerSelect = e => {
    // console.log(e.target.attributes["data-value"].value);
    setSelectedAnswer(e.target.attributes["data-value"].value);
  };

  // If auth'd...
  if (user) {
    return (
      <div className="p-4 pt-10 text-gray-200">
        <div className="p-2">
          {questions.length > 0 && currentQuestionId !== null && (
            <div className="">
              <div className="text-3xl font-bold leading-tight mb-6 text-center">
                {questions[currentQuestionId].question}
              </div>
              <div className="">
                {questions[currentQuestionId].answers.map((answer, i) => {
                  return (
                    <div className="my-4">
                      <div
                        key={i}
                        onClick={e => onAnswerSelect(e)}
                        data-value={i}
                        className={`answer rounded-full p-3 inline-block w-full text-center ${
                          selectedAnswer == i ? "bg-indigo-700" : "bg-gray-800"
                        }`}
                      >
                        {answer}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bottom-0 inset-x-0 fixed border-t border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="">
              {playerValue && (
                <div className="">
                  {playerValue.data().name} is{" "}
                  {playerIsActive ? "in" : "out of"} the game.
                </div>
              )}
            </div>
            <div className="">
              <button className="text-indigo-500" onClick={logout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user not defined, list available games
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
      <div className="my-5">
        <div className="font-bold mb-4 py-1 text-xl">Who are you?</div>
        <input
          className="border-0 bg-gray-900 p-2 w-full text-lg"
          placeholder="Your name"
          ref={nameRef}
        />
      </div>
      <div className="font-bold mb-4 py-1 text-xl">Choose a game to join</div>
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
                  className="bg-indigo-600 text-white p-2 px-4 rounded"
                  onClick={() => login(game)}
                >
                  Join
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Player;
