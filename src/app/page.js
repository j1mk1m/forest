'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import 'primereact/resources/themes/mira/theme.css';
import { PrimeReactProvider } from 'primereact/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import 'primeicons/primeicons.css';

import MenuBar from '@/app/_components/menubar';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
export const db = getFirestore(app);
export const auth = getAuth();

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authUser, setAuthUser] = useState(false)

    auth.onAuthStateChanged((authUser) => {
        authUser
        ? setAuthUser(true)
        : setAuthUser(false);
    });

    const handleSignin = () => {
        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
        })
        .catch((error) => {
            const errorMessage = error.message;
            console.log(errorMessage);
        });
        setEmail("");
        setPassword("");
    }
    
    if (!authUser) {
        return (
            <PrimeReactProvider>
                <Card className="md:w-25rem">                
                    <h1 className='text-black m-5 text-center'>Sign In</h1>
                    <InputText value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Password value={password} onChange={(e) => setPassword(e.target.value)} feedback={false} tabIndex={1} />
                    <Button label='Sign In' onClick={handleSignin} />
                </Card>
            </PrimeReactProvider>
        );
    }

    return (
        <PrimeReactProvider>
            <MenuBar />
            <h1 className="text-black m-5 text-center">Welcome!</h1>
        </PrimeReactProvider>
    );
}
