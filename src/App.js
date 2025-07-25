import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from 'firebase/firestore';
import './App.css';

const quiz = [
  {
    question: "What is the capital of India?",
    options: ["Mumbai", "Delhi", "Kolkata", "Hyderabad"],
    answer: 1,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Venus", "Mars", "Jupiter"],
    answer: 2,
  },
  {
    question: "What is the square root of 64?",
    options: ["6", "7", "8", "9"],
    answer: 2,
  },
];

function App() {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [hasEarnedToken, setHasEarnedToken] = useState(false);
  const [draws, setDraws] = useState([]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setTokens(userSnap.data().tokens || 0);
        } else {
          await setDoc(userRef, { tokens: 0, enteredDraws: [] });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to draw updates from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "meta", "draws"), (docSnap) => {
      if (docSnap.exists()) {
        setDraws(docSnap.data().list || []);
      }
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logOut = () => {
    signOut(auth);
  };

  const handleNextQuestion = async () => {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex(quizIndex + 1);
      setSelectedOption(null);
    } else {
      setQuizCompleted(true);
      if (!hasEarnedToken && user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { tokens: tokens + 1 });
        setTokens(tokens + 1);
        setHasEarnedToken(true);
      }
    }
  };

  const handleEnterDraw = async (drawId, cost) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const enteredDraws = userSnap.data().enteredDraws || [];

    if (enteredDraws.includes(drawId)) {
      alert("🚫 Already entered this draw.");
      return;
    }

    if (tokens >= cost) {
      await updateDoc(userRef, {
        tokens: tokens - cost,
        enteredDraws: arrayUnion(drawId)
      });
      setTokens(tokens - cost);
      alert("✅ Entered into the draw!");
    } else {
      alert("❌ Not enough tokens!");
    }
  };

  return (
    <div className="App">
      <h1>🎯 Lucky Draw Platform</h1>
      {user ? (
        <>
          <p>👤 Welcome, {user.displayName} | 🎫 Tokens: {tokens}</p>
          <button onClick={logOut}>Logout</button>
        </>
      ) : (
        <button onClick={signIn}>Login with Google</button>
      )}

      {user && (
        <>
          {!quizStarted && !quizCompleted && (
            <div>
              <h2>🔥 Today's Quiz - Earn 1 Token</h2>
              <button onClick={() => setQuizStarted(true)}>Start Quiz</button>
            </div>
          )}

          {quizStarted && !quizCompleted && (
            <div>
              <h3>{quiz[quizIndex].question}</h3>
              {quiz[quizIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  style={{ background: selectedOption === idx ? "lightblue" : "" }}
                  onClick={() => setSelectedOption(idx)}
                >
                  {opt}
                </button>
              ))}
              <br />
              <button disabled={selectedOption === null} onClick={handleNextQuestion}>
                Next
              </button>
            </div>
          )}

          {quizCompleted && <p>🎉 You've earned 1 token!</p>}

          <h2>🎁 Available Draws</h2>
          {draws.map((draw) => (
            <div key={draw.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
              <p>🎁 {draw.prize}</p>
              <p>Cost: {draw.tokens} Tokens</p>
              <button onClick={() => handleEnterDraw(draw.id, draw.tokens)}>Enter Draw</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
