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
            id: 'timber',
            label: 'timber',
            icon: 'pi pi-list',
            command: () => {
                router.push('/timber');
            }
        },
        {
            id: 'logger',
            label: 'logger',
            icon: 'pi pi-book',
            command: () => {
                router.push('/logger');
            }
        },
        {
            id: 'varphi',
            label: 'varphi',
            icon: 'pi pi-calculator',
            command: () => {
                router.push('/varphi');
            }
        },
        {
            id: 'parrot',
            label: 'parrot',
            icon: 'pi pi-users',
            command: () => {
                router.push('/parrot');
            }
        },
    ]
    return (
        <Menubar model={menubar} start={<Link href='/'><h3 className='text-white text-lg mx-2'>forest</h3></Link>} style={{backgroundColor: 'rgb(64, 99, 70'}}/>
    );
}