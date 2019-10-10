import React, { useContext, useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import firebase from "./firebase";

const Player = () => {
  const db = firebase.firestore();

  const [user, initializing, error] = useAuthState(firebase.auth());

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

  useEffect(() => {
    console.log("Starting");
    listAvailableGames().then(snapshot => {
      const games = [];
      snapshot.forEach(doc => {
        console.log("Found open game:", doc.data().title);
        games.push(doc.data().title);
      });
      if (user && games.length > 0) {
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

  if (user) {
    return (
      <div className="m-10">
        <p>Current User: {user.uid}</p>
        <button className="bg-black text-white p-2" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

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
      <div className="">Hi.</div>
      <button className="bg-black text-white p-2" onClick={login}>
        Log in
      </button>
    </div>
  );
};

export default Player;
