//API_URL
//const API_URL = "http://localhost:8000/api";
const API_URL = "https://push.gotiking.com/api";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDCEr29Ji7Y_f5W9gzeOEViad1rNLl1mlw",
  authDomain: "ludo-b0877.firebaseapp.com",
  projectId: "ludo-b0877",
  storageBucket: "ludo-b0877.appspot.com",
  messagingSenderId: "327439659478",
  appId: "1:327439659478:web:07f15ed6ecb9c6ec04b477",
  measurementId: "G-BHMVNXRVME",
};
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();

const publicVapidKey =
  "BOvFUtv41OibMjGI7OZLiHtAqs2pWkVnZJhvMFMZVc10YSoJJsga0PJhiJ7K4E4UVEwbe5P9M17rNwYUE7rlad4";
// Add the public key generated from the console here.

let theHeader = new Headers();
theHeader.append("Content-Type", "application/json");
messaging.getToken({ vapidKey: publicVapidKey }).then((token) => {

  if (!localStorage.getItem("tokenSent")) {
    const body = {
      sitename: location.hostname,
      country: "India",
      token: token,
    };

    fetch(`${API_URL}/user/subscribe`, {
      method: "POST",
      headers: theHeader,
      body: JSON.stringify(body),
    }).then((r) => {
      localStorage.setItem("tokenSent", true);
      r.json(() => {});
    });
  }
});