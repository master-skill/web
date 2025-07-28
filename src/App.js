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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "meta", "draws"), (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.list)) {
            setDraws(data.list);
          } else {
            setDraws([]);
          }
        } else {
          setDraws([]);
        }
      } catch (error) {
        console.error("Error processing draws data:", error);
        setDraws([]);
      }
    }, (error) => {
      console.error("Error listening to draws:", error);
      setDraws([]);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center text-indigo-600">🎯 Lucky Draw Platform</h1>

        {user ? (
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="text-gray-700 font-medium">👤 {user.displayName}</p>
              <p className="text-green-600 font-semibold">🎫 Tokens: {tokens}</p>
            </div>
            <button
              onClick={logOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={signIn}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Login with Google
            </button>
          </div>
        )}

        {user && (
          <>
            {!quizStarted && !quizCompleted && (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">🔥 Today's Quiz - Earn 1 Token</h2>
                <button
                  onClick={() => setQuizStarted(true)}
                  className="mt-3 bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
                >
                  Start Quiz
                </button>
              </div>
            )}

            {quizStarted && !quizCompleted && (
              <div>
                <h3 className="text-lg font-medium mb-4">{quiz[quizIndex].question}</h3>
                <div className="space-y-2">
                  {quiz[quizIndex].options.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`w-full px-4 py-2 rounded border text-left ${
                        selectedOption === idx
                          ? "bg-blue-200 border-blue-400"
                          : "bg-white border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedOption(idx)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  disabled={selectedOption === null}
                  onClick={handleNextQuestion}
                  className="mt-4 bg-green-600 text-white px-5 py-2 rounded disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}

            {quizCompleted && (
              <p className="text-green-700 font-semibold text-center">🎉 You've earned 1 token!</p>
            )}

            <h2 className="text-xl font-bold mt-6 text-gray-800">🎁 Available Draws</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {draws.map((draw) => (
                <div
                  key={draw.id}
                  className="border border-gray-200 p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  <p className="text-lg font-semibold text-indigo-700">🎁 {draw.prize}</p>
                  <p className="text-gray-600">Cost: {draw.tokens} Token(s)</p>
                  <button
                    onClick={() => handleEnterDraw(draw.id, draw.tokens)}
                    className="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Enter Draw
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
