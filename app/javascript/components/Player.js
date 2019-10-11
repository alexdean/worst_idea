import React, { useContext, useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionOnce } from "react-firebase-hooks/firestore";
import firebase from "./firebase";

const db = firebase.firestore();

const Player = () => {
  const [gameId, setGameId] = useState(null); // stores the gameId
  const [user, initializing, error] = useAuthState(firebase.auth()); // establishes and maintains fb auth

  // gets all the questions for the gameId stored in the above state...
  const [questionsValue, questionsLoading, questionsError] = useCollectionOnce(
    gameId &&
      db
        .collection("games")
        .doc(gameId)
        .collection("questions")
  );

  const login = () => {
    firebase
      .auth()
      .signInAnonymously()
      .catch(function(error) {
        console.error("firebase auth error", error);
      });
  };

  const logout = () => {
    firebase.auth().signOut();
  };

  const listAvailableGames = () => {
    return db
      .collection("games")
      .where("current_stage", "==", "joining")
      .get();
  };

  const joinGame = gameId => {
    return db
      .collection("games")
      .doc(gameId)
      .collection("players")
      .doc(user.uid)
      .set({ is_active: true });
  };

  // useEffect runs whenever the values listed in the last argument change
  // In this case, whenever {user} updates
  useEffect(() => {
    listAvailableGames().then(snapshot => {
      const games = [];
      snapshot.forEach(doc => {
        console.log("Found open game:", doc.data().title);
        games.push(doc.data().title);
      });

      if (user && games.length > 0) {
        setGameId(games[0]);
        console.log("Joining first available game");
        joinGame(games[0]).then(
          response => {
            console.log("Successfully joined game", games[0], response);
          },
          failure => {
            console.error("Error joining game", games[0], failure);
          }
        );
      }
    });
  }, [user]);

  // If auth'd...
  if (user) {
    return (
      <div className="m-10">
        <div>Current User: {user.uid}</div>
        <div className="p-2 bg-blue-100">
          {questionsLoading && <div className="">Loading</div>}
          {questionsError && <div className="">{JSON.stringify(error)}</div>}
          {questionsValue &&
            questionsValue.docs.map((doc, i) => {
              return (
                <div key={i} className="">
                  {doc.data().question}
                </div>
              );
            })}
        </div>
        <button className="bg-black text-white p-2" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  // If user not defined, render the start button
  return (
    <div className="m-10">
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
      <div className="">Click the button to start the game</div>
      <button className="bg-black text-white p-2" onClick={login}>
        Start
      </button>
    </div>
  );
};

export default Player;
