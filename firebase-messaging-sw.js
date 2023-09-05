importScripts("https://www.gstatic.com/firebasejs/7.14.6/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/7.14.6/firebase-messaging.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyDCEr29Ji7Y_f5W9gzeOEViad1rNLl1mlw",
  authDomain: "ludo-b0877.firebaseapp.com",
  projectId: "ludo-b0877",
  storageBucket: "ludo-b0877.appspot.com",
  messagingSenderId: "327439659478",
  appId: "1:327439659478:web:07f15ed6ecb9c6ec04b477",
  measurementId: "G-BHMVNXRVME"
};
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();