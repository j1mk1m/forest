'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'

import { Menubar } from 'primereact/menubar';
import 'primeicons/primeicons.css';
import { Toolbar } from 'primereact/toolbar';

export default function MenuBar () {
    const router = useRouter();
    const menubar = [
        {
            id: 'logger',
            label: 'Logger',
            icon: 'pi pi-book',
            command: () => {
                router.push('/logger');
            }
        },
        {
            id: 'contacts',
            label: 'Contacts',
            icon: 'pi pi-users',
            command: () => {
                router.push('/contacts');
            }
        },
        {
            id: 'formulas',
            label: 'Formulas',
            icon: 'pi pi-calculator',
            command: () => {
                router.push('/formulas');
            }
        }
    ]
    return (
        <Menubar model={menubar} style={{backgroundColor: 'rgb(64, 99, 70'}}/>
        // <Toolbar start={
        //     <React.Fragment>
        //         <Link href='/logger'>Logger</Link>
        //         <Link href='/contacts'>Contacts</Link>
        //         <Link href='/formulas'>Formulas</Link>
        //     </React.Fragment>
        // } />
    );
}