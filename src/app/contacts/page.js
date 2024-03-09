'use client';
import React from 'react';
import { useState, useEffect } from 'react';

import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/themes/mira/theme.css';
import MenuBar from '@/app/_components/menubar';

export default function Page () {
    return (
        <PrimeReactProvider>
            <MenuBar/>
            <p>Contacts</p>
        </PrimeReactProvider>
    );
}