import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase'; // Imports from your firebase.js file

// Define the quiz questions
const quiz = [
  {
    question: "What is the capital of India?",
    options: ["Mumbai", "Delhi", "Kolkata", "Hyderabad"],
    answer: 1, // Index of the correct answer
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

// MessageModal component to replace alert()
const MessageModal = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
                  'bg-blue-100 border-blue-400 text-blue-700';
  const borderColor = type === 'success' ? 'border-green-500' :
                      type === 'error' ? 'border-red-500' :
                      'border-blue-500';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`relative p-6 rounded-lg shadow-xl max-w-sm w-full border-t-4 ${borderColor} ${bgColor}`}>
        <p className="text-center font-semibold text-lg mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          OK
        </button>
      </div>
    </div>
  );
};

function App() {
  // State variables for Firebase and user data
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState('');
  const [tokens, setTokens] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [hasEarnedToken, setHasEarnedToken] = useState(false); // Prevents earning multiple tokens from one quiz session

  // New state for "Watch Ad" functionality
  const [canWatchAd, setCanWatchAd] = useState(true);
  const [adCooldown, setAdCooldown] = useState(0); // Cooldown in seconds

  const [draws, setDraws] = useState([]); // Stores available lucky draws
  const [message, setMessage] = useState(''); // For custom message modal
  const [messageType, setMessageType] = useState('info'); // Type of message (success, error, info)
  const [enteredDraws, setEnteredDraws] = useState([]); // Stores draws the user has entered

  // Use a fixed appId for consistency with the provided original code's Firestore paths
  const APP_ID = 'default-app-id'; 

  // Initialize Firebase and set up authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          setUserId(currentUser.uid);

          // Fetch user data from Firestore
          if (db) {
            const userRef = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/user_data/profile`);
            try {
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                setTokens(userData.tokens || 0);
                // Reset quiz and ad state on user login/re-authentication
                setQuizStarted(false);
                setQuizIndex(0);
                setSelectedOption(null);
                setQuizCompleted(false);
                setHasEarnedToken(false);
                setCanWatchAd(true);
                setAdCooldown(0);
                if (userData.enteredDraws) {
                  setEnteredDraws(userData.enteredDraws);
                }
              } else {
                // Create user document if it doesn't exist
                await setDoc(userRef, {
                  displayName: currentUser.displayName || 'Anonymous',
                  email: currentUser.email || '',
                  photoURL: currentUser.photoURL || '',
                  tokens: 0,
                  enteredDraws: [],
                  createdAt: new Date().toISOString()
                });
                setTokens(0);
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
              setMessage("Failed to load user data.");
              setMessageType("error");
            }
          }
        } else {
          setUser(null);
          setUserId('');
          setTokens(0);
          setQuizStarted(false);
          setQuizIndex(0);
          setSelectedOption(null);
          setQuizCompleted(false);
          setHasEarnedToken(false);
          setCanWatchAd(true);
          setAdCooldown(0);
          setEnteredDraws([]);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [db]);

  // Listen for real-time updates to available draws
  useEffect(() => {
    if (!db) {
      console.log("Firestore not initialized");
      return;
    }

    console.log("Attempting to fetch draws from: meta/draws");
    const drawsRef = doc(db, 'meta', 'draws');
    
    const unsub = onSnapshot(
      drawsRef, 
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Draws data received:", data);
            if (data && Array.isArray(data.list)) {
              console.log("Setting draws:", data.list);
              setDraws(data.list);
            } else {
              console.warn("Draws data is not in expected format");
              setDraws([]);
            }
          } else {
            console.warn("Draws document not found");
            setDraws([]);
          }
        } catch (error) {
          console.error("Error processing draws data:", error);
          setDraws([]);
        }
      },
      (error) => {
        console.error("Error in draws listener:", {
          code: error.code,
          message: error.message,
          details: error
        });
        setDraws([]);
      }
    );

    return () => unsub();
  }, [db]); // Only depend on db

  // Google Sign-in function
  const signInWithGoogle = async () => {
    if (!auth) {
      console.error("Auth not initialized");
      setMessage("Authentication service not available. Please try again later.");
      return;
    }
    
    try {
      await signInWithPopup(auth, googleProvider);
      // User is automatically handled by the auth state listener above
      setMessage("Successfully signed in with Google!");
      setMessageType("success");
    } catch (error) {
      console.error("Google Sign-in failed:", error);
      
      // Handle specific errors
      const errorCode = error.code;
      let userFriendlyMessage = "Google sign-in failed. Please try again.";
      
      if (errorCode === 'auth/account-exists-with-different-credential') {
        userFriendlyMessage = "An account already exists with the same email but different sign-in credentials.";
      } else if (errorCode === 'auth/popup-closed-by-user') {
        userFriendlyMessage = "Sign in popup was closed before completing the sign-in process.";
      } else if (errorCode === 'auth/cancelled-popup-request') {
        userFriendlyMessage = "Only one popup request is allowed at a time.";
      } else if (errorCode === 'auth/popup-blocked') {
        userFriendlyMessage = "Popup was blocked by the browser. Please allow popups for this site and try again.";
      }
      
      setMessage(userFriendlyMessage);
      setMessageType("error");
    }
  };

  // Logout function
  const logOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setMessage("Logged out successfully.");
      setMessageType("success");
    } catch (error) { // Corrected syntax: 'catch (error)' instead of ': (error)'
      console.error("Logout failed:", error);
      setMessage("Logout failed. Please try again.");
      setMessageType("error");
    }
  };

  // Handle moving to the next quiz question or completing the quiz
  const handleNextQuestion = async () => {
    // Check if the selected option is correct before proceeding
    if (selectedOption === null || quiz[quizIndex].answer !== selectedOption) {
      setMessage("Incorrect answer. Please try again!");
      setMessageType("error");
      return;
    }

    if (quizIndex < quiz.length - 1) {
      setQuizIndex(quizIndex + 1);
      setSelectedOption(null); // Reset selected option for next question
    } else {
      setQuizCompleted(true);
      // Only award token if user hasn't earned one in this session and is logged in
      if (!hasEarnedToken && user && db && userId) {
        const userRef = doc(db, `artifacts/${APP_ID}/users/${userId}/user_data/profile`);
        try {
          await updateDoc(userRef, { tokens: tokens + 1 });
          setTokens(prevTokens => prevTokens + 1); // Update local state
          setHasEarnedToken(true); // Mark token as earned for this session
          setMessage("🎉 You've earned 1 token from the quiz!");
          setMessageType("success");
        } catch (error) {
          console.error("Error updating tokens:", error);
          setMessage("Failed to award token. Please try again.");
          setMessageType("error");
        }
      }
    }
  };

  // Watch ad to earn tokens
  const handleWatchAd = async () => {
    if (!user || !canWatchAd) return;
    
    try {
      // In a real app, you would show an ad here
      console.log("Showing ad...");
      
      // Simulate ad watching with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Award 5 tokens
      const newTokenCount = tokens + 5;
      setTokens(newTokenCount);
      
      // Update tokens in Firestore
      if (db && user) {
        const userRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/user_data/profile`);
        await updateDoc(userRef, {
          tokens: newTokenCount,
          lastAdWatchedAt: new Date().toISOString()
        });
      }
      
      // Set cooldown (30 minutes in milliseconds)
      const cooldownMs = 30 * 60 * 1000;
      setCanWatchAd(false);
      setAdCooldown(Math.floor(cooldownMs / 1000)); // Convert to seconds for display
      
      // Update cooldown every second
      const timer = setInterval(() => {
        setAdCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanWatchAd(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setMessage("You've earned 5 tokens!");
      setMessageType("success");
      
    } catch (error) {
      console.error("Error watching ad:", error);
      setMessage("Failed to process ad reward. Please try again.");
      setMessageType("error");
    }
  };

  // Handle entering a lucky draw
  const handleEnterDraw = async (drawId, cost) => {
    if (!user || !db) return;
    
    if (tokens < cost) {
      setMessage("Not enough tokens to enter this draw!");
      setMessageType("error");
      return;
    }

    try {
      // Deduct tokens
      const newTokenCount = tokens - cost;
      setTokens(newTokenCount);
      
      // Update tokens in Firestore
      const userRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/user_data/profile`);
      await updateDoc(userRef, {
        tokens: newTokenCount,
        enteredDraws: arrayUnion(drawId)  // Add this draw to the user's entered draws
      });
      
      // Update local state to reflect the entered draw
      setEnteredDraws(prev => [...prev, drawId]);
      
      setMessage(`Successfully entered the draw!`);
      setMessageType("success");
      
    } catch (error) {
      console.error("Error entering draw:", error);
      setMessage("Failed to enter draw. Please try again.");
      setMessageType("error");
      
      // Revert token count on error
      setTokens(prev => prev + cost);
    }
  };

  useEffect(() => {
    if (!user || !db) return;
    
    const loadUserData = async () => {
      try {
        const userRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/user_data/profile`);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.enteredDraws) {
            setEnteredDraws(userData.enteredDraws);
          }
        }
      } catch (error) {
        console.error("Error loading user's entered draws:", error);
      }
    };
    
    loadUserData();
  }, [user, db]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 sm:p-6 font-inter antialiased">
      {/* Custom Message Modal */}
      <MessageModal message={message} type={messageType} onClose={() => setMessage('')} />

      {/* Google Fonts - Inter */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-6 sm:p-8 space-y-8 border border-indigo-100 transform transition-all duration-300 hover:scale-[1.01]">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-indigo-800 tracking-tight leading-tight">
          <span role="img" aria-label="Target">🎯</span> Prize Perks Zone
        </h1>

        {/* User Authentication Section */}
        {user ? (
          <div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4 p-5 bg-indigo-50 rounded-2xl shadow-inner border border-indigo-200">
            <div className="text-center sm:text-left">
              <p className="text-gray-800 font-semibold text-xl flex items-center justify-center sm:justify-start gap-2">
                <span role="img" aria-label="User">👤</span> {user.displayName || 'Guest User'}
              </p>
              <p className="text-green-700 font-bold text-2xl mt-2 flex items-center justify-center sm:justify-start gap-2">
                <span role="img" aria-label="Ticket">🎫</span> Tokens: {tokens}
              </p>
              {/* User ID display - useful for debugging/identification in multi-user apps */}
              {userId && <p className="text-gray-500 text-sm mt-1 break-all">User ID: {userId}</p>}
            </div>
            <button
              onClick={logOut}
              className="bg-red-600 text-white px-7 py-3 rounded-xl shadow-lg hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 font-bold text-lg"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center p-6 bg-gray-50 rounded-2xl shadow-md border border-gray-200">
            <p className="text-gray-700 mb-5 text-xl font-medium">Sign in to earn tokens and enter exciting draws!</p>
            <button
              onClick={signInWithGoogle}
              className="bg-blue-600 text-white px-10 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 font-bold text-xl flex items-center justify-center mx-auto gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V11.7h2.76A6.9 6.9 0 0 1 12 14.2c-3.14 0-5.7-2.56-5.7-5.7s2.56-5.7 5.7-5.7c1.7 0 3.16.6 4.3 1.6l2.16-2.16C16.5 2.14 14.4 1 12 1 6.48 1 2 5.48 2 11s4.48 10 10 10c5.52 0 10-4.48 10-10 0-.68-.08-1.35-.2-2H12.24z"/>
              </svg>
              Login with Google
            </button>
          </div>
        )}

        {/* Available Draws Section - Moved to top */}
        <h2 className="text-3xl font-bold mt-6 text-gray-800 text-center flex items-center justify-center gap-3">
          <span role="img" aria-label="Gift">🎁</span> Available Draws
        </h2>
        {draws.length === 0 ? (
          <p className="text-center text-gray-600 italic text-lg mt-4">No draws available at the moment. Check back later!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {draws.map((draw) => (
              <div
                key={draw.id}
                className="border border-purple-200 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 ease-in-out bg-white flex flex-col justify-between transform hover:-translate-y-1 hover:scale-105"
              >
                <div>
                  <p className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <span role="img" aria-label="Prize">🏆</span> {draw.prize}
                  </p>
                  <p className="text-gray-700 text-lg">Cost: <span className="font-extrabold text-purple-800">{draw.tokens} Token(s)</span></p>
                </div>
                <button
                  onClick={() => handleEnterDraw(draw.id, draw.tokens)}
                  disabled={enteredDraws.includes(draw.id) || tokens < draw.tokens}
                  className={`mt-5 w-full px-6 py-3 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 font-bold text-lg ${
                    enteredDraws.includes(draw.id)
                      ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 cursor-default'
                      : tokens >= draw.tokens
                      ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-300'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {enteredDraws.includes(draw.id) ? 'Entered!' : 'Enter Draw'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Ways to Earn Tokens Section (Visible only if user is logged in) */}
        {user && (
          <div className="space-y-6 mt-10">
            <h2 className="text-3xl font-bold text-gray-800 text-center flex items-center justify-center gap-3">
              <span role="img" aria-label="Money Bag">💰</span> Earn More Tokens
            </h2>

            {/* Quiz Section */}
            {!quizStarted && !quizCompleted && (
              <div className="text-center p-7 bg-yellow-50 rounded-2xl shadow-lg border border-yellow-200 animate-fade-in">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
                  <span role="img" aria-label="Fire">🔥</span> Today's Quiz - Earn 1 Token
                </h3>
                <p className="text-gray-700 mb-6 text-lg">Answer 3 simple questions correctly to get a free token!</p>
                <button
                  onClick={() => {
                    setQuizStarted(true);
                    setQuizCompleted(false);
                    setQuizIndex(0);
                    setSelectedOption(null);
                    setHasEarnedToken(false);
                  }}
                  className="bg-yellow-500 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-yellow-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-bold text-xl"
                >
                  Start Quiz
                </button>
              </div>
            )}

            {quizStarted && !quizCompleted && (
              <div className="p-7 bg-blue-50 rounded-2xl shadow-lg border border-blue-200 animate-fade-in">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                  Question {quizIndex + 1} of {quiz.length}: {quiz[quizIndex].question}
                </h3>
                <div className="space-y-4">
                  {quiz[quizIndex].options.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`w-full px-6 py-3 rounded-xl border text-left text-lg font-medium transition duration-200 ease-in-out
                        ${selectedOption === idx
                          ? "bg-blue-300 border-blue-500 text-blue-900 shadow-inner"
                          : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-400 shadow-sm"
                        } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50`}
                      onClick={() => setSelectedOption(idx)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  disabled={selectedOption === null}
                  onClick={handleNextQuestion}
                  className="mt-8 w-full bg-green-600 text-white px-7 py-3.5 rounded-xl shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 font-bold text-xl"
                >
                  {quizIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
              </div>
            )}

            {quizCompleted && (
              <div className="text-center p-7 bg-green-50 rounded-2xl shadow-lg border border-green-200 animate-fade-in">
                <p className="text-green-700 font-bold text-3xl mb-4">
                  {hasEarnedToken ? "🎉 You've successfully earned 1 token from the quiz!" : "You've completed the quiz!"}
                </p>
                <button
                  onClick={() => {
                    setQuizStarted(false);
                    setQuizCompleted(false);
                    setQuizIndex(0);
                    setSelectedOption(null);
                    setHasEarnedToken(false);
                  }}
                  className="bg-indigo-600 text-white px-7 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 font-bold text-lg"
                >
                  Go Back to Main
                </button>
              </div>
            )}

            {/* Watch Ad Section */}
            <div className="text-center p-7 bg-purple-50 rounded-2xl shadow-lg border border-purple-200 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
                <span role="img" aria-label="Video Camera">📺</span> Watch an Ad - Earn 5 Bonus Tokens
              </h3>
              <p className="text-gray-700 mb-6 text-lg">Watch a short advertisement to earn extra tokens!</p>
              <button
                onClick={handleWatchAd}
                disabled={!canWatchAd || !user}
                className={`px-8 py-3.5 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 font-bold text-xl
                  ${canWatchAd && user
                    ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-300'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
              >
                {user ? (canWatchAd ? 'Watch Ad' : `Cooldown: ${adCooldown}s`) : 'Login to Watch Ad'}
              </button>
            </div>
          </div>
        )}

        {/* Promotions Section */}
        {user && (
          <div className="mt-10 p-7 bg-gray-100 rounded-2xl shadow-lg border border-gray-200 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-6 flex items-center justify-center gap-3">
              <span role="img" aria-label="Megaphone">📢</span> Special Promotions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl shadow-md border border-blue-100">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">🚀 Exclusive New User Bonus!</h3>
                <p className="text-gray-700 text-md">Sign up today and get 5 extra tokens instantly!</p>
                <button className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition duration-200">Claim Now</button>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md border border-green-100">
                <h3 className="text-xl font-semibold text-green-700 mb-2">🌟 Weekend Double Tokens!</h3>
                <p className="text-gray-700 text-md">Earn double tokens on quizzes this weekend. Don't miss out!</p>
                <button className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition duration-200">Learn More</button>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              *Promotions are subject to terms and conditions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
