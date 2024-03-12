'use client';
import React from 'react';
import { useState, useEffect } from 'react';

import { PrimeReactProvider } from 'primereact/api';
import MenuBar from '@/app/_components/menubar';

export default function Page () {
    return (
        <PrimeReactProvider>
            <MenuBar/>
            <h1 className="text-black text-lg font-bold m-3 p-2 text-center">timber - task manager</h1>
        </PrimeReactProvider>
    );
}

/*
Task
Type
Urgency
Due Date
Done

*/