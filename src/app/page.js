'use client';
import React from 'react';
import { useState } from 'react';

import 'primereact/resources/themes/saga-green/theme.css';
import { PrimeReactProvider } from 'primereact/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
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
    const [authUser, setAuthUser] = useState(false);
    const [loading, setLoading] = useState(true);

    const [number, setNumber] = useState(52);
    const [disabled, setDisabled] = useState(false);

    auth.onAuthStateChanged((authUser) => {
        authUser
        ? setAuthUser(true)
        : setAuthUser(false);
        setLoading(false);
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

    const startFocus = () => {
        const time = number;
        setNumber(52);
        setDisabled(true);
        const timeEl = document.getElementById('timeleft');
        timeEl.innerHTML = time;
        const timeout = setInterval(() => timeEl.innerHTML -= 1, 60000);
        setTimeout(() => {
            clearInterval(timeout);
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notification");
            } else if (Notification.permission === "granted") {
                const notification = new Notification("Time!");
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    const notification = new Notification("Time!");
                }
                });
            }
            setDisabled(false);
        }, time * 60 * 1000);
    }

    if (loading) {
        return (
            <PrimeReactProvider>
                 <div style={{minHeight: '100vh'}} className='justify-center items-center flex'>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                 </div>
            </PrimeReactProvider>
        )
    }
    
    if (!authUser) {
        return (
            <PrimeReactProvider>
                <div style={{minHeight: '100vh'}} className='justify-center items-center flex'>
                    <Card className="flex flex-col items-center w-fit p-0">
                        <h1 className='font-bold text-xl text-center my-1 py-0 text-green-900'>forest</h1>
                        <div className='width: 100% flex flex-row'><InputText value={email} placeholder='Email' onChange={(e) => setEmail(e.target.value)} className='mx-3 my-1 p-2 flex-1'/></div>
                        <div className='width: 100% flex flex-row'><Password value={password} placeholder='Password' onChange={(e) => setPassword(e.target.value)} feedback={false} tabIndex={1} className='m-3 flex-1'/></div>
                        <div className='flex'><Button label='Sign In' onClick={handleSignin} className='mx-3 my-1 p-2 flex-1'/></div>
                    </Card>
                </div>
            </PrimeReactProvider>
        );
    }

    return (
        <PrimeReactProvider>
            <MenuBar />
            <h1 className="text-black text-lg font-bold m-5 text-center">forest</h1>
            <p className='text-black text-md text-center'>Start a new focus session...</p>
            <div className='flex items-center justify-center content-center my-1'>
                <InputNumber value={number} placeholder='minutes' disabled={disabled} onChange={(e) => setNumber(e.value)} className='mx-2'/>
                <Button label='start' onClick={startFocus}/>
            </div>
            <div className='flex items-center justify-center'>
                <p id="timeleft" className='text-center'>0</p>
                <p className='text-center mx-1'>minutes remaining</p>
            </div>
        </PrimeReactProvider>
    );
}

/*
Features for Home page:
Contacts - upcoming birthdays
To do - upcoming tasks
Logger - recent logs
Formulas - 

focus?
Achievements: 
*/