// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxq0SHwcPkXj0cM61ZMXni5nFdJUdOqMs",
  authDomain: "logger-74a09.firebaseapp.com",
  projectId: "logger-74a09",
  storageBucket: "logger-74a09.appspot.com",
  messagingSenderId: "59632848725",
  appId: "1:59632848725:web:c37296acd3a4e390d869dc",
  measurementId: "G-16CT4QV8R2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default db = getFirestore(app);