'use client';
import React, { useRef, useState, useEffect } from 'react';

import { PrimeReactProvider } from 'primereact/api';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import 'primeicons/primeicons.css';

import MenuBar from '@/app/_components/menubar';
import { db, auth } from '@/app/page';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function Page () {
    const toast = useRef(null);
    const [contacts, setContacts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [edit, setEdit] = useState(false);
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [conts, setConts] = useState("");
    const [date, setDate] = useState(null);
    const [tags, setTags] = useState("");
    const [interactions, setInteractions] = useState("");
    const [loading, setLoading] = useState(true);

    const dateTemplate = (value) => {
        if (value.date.seconds) {
            const date = new Date(value.date.seconds * 1000);
            return date.toDateString();
        } else {
            return value.date.toDateString();
        }
    }

    const fetchData = async () => {
        try {
            const contactDocs = await getDocs(collection(db, "contacts"));
            const newContacts = contactDocs.docs.map((doc) => {
                const full_name = doc.data().first_name + " " + doc.data().last_name;
                return {...doc.data(), 
                    id: doc.id, 
                    full_name: full_name, 
                    tags_string: doc.data().tags.join(", "),
                    contacts_string: doc.data().contacts.join(", "),
                    interactions_preview: doc.data().interactions.join(", ").substring(0, 50),
                };
            }); 
            setContacts(newContacts);
            setLoading(false);
        } catch (error){
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch data' });
            console.log(error);
        }
    }

    const addContact = async () => {
        if (fname == "") {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'First Name field is required' });
            return;
        }
        try {
            const data = {
                first_name: fname,
                last_name: lname, 
                tags: tags.split(",").map((doc) => doc.trim()),
                interactions: interactions.split(",").map((doc) => doc.trim()),
                contacts: conts.split(",").map((doc) => doc.trim()),
                date: date
            };
            if (editingId) {
                await setDoc(doc(db, "contacts", editingId), data);
                contacts[contacts.findIndex((doc) => doc.id == editingId)] = {...data, 
                    id: editingId,
                    full_name: fname + " " + lname, 
                    tags_string: tags,
                    contacts_string: conts,
                    interactions_preview: interactions.substring(0,50)
                };
            } else {
                const ret = await addDoc(collection(db, "contacts"), data);
                contacts.push({...data, 
                    id: ret.id,
                    full_name: fname + " " + lname, 
                    tags_string: tags,
                    contacts_string: conts,
                    interactions_preview: interactions.substring(0, 50)
                });
            }
            setContacts(contacts);
            setFname("");
            setLname("");
            setTags("");
            setConts("");
            setDate(null);
            setInteractions("");
            if (editingId) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Contact Successfully Edited!' });
            } else {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Contact Successfully Added!' });
            }
            setEditingId(null);
            setEdit(false);
        } catch (error) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not add Item' });
            console.log(error);
        }
    }

    const deleteContact = async () => {
        if (selected) {
            try {
                await deleteDoc(doc(db, "contacts", selected.id));
                setItems(contacts.filter((doc) => doc.id != selected.id));
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Contact Successfully Deleted!' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not delete Item' });
                console.log(error);
            }
        }
    }

    const editContact = (item) => {
        setEditingId(item.id);
        setFname(item.first_name);
        setLname(item.last_name);
        const newDate = new Date(item.date.seconds * 1000);
        setDate(newDate);
        setTags(item.tags.join(", "));
        setInteractions(item.interactions.join(",\n"));
        setConts(item.contacts.join(",\n"));
        setEdit(true);
    }

    const editButtonTemplate = (value) => {
        return (
            <Button icon="pi pi-pencil" onClick={() => editContact(value)} rounded text raised />
        );
    }

    const clearDialog = () => {
        setLname("");
        setFname("");
        setConts("");
        setDate(null);
        setInteractions("");
        setTags("");
        setEdit(false);
        setEditingId(null);
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <PrimeReactProvider>
            <Toast ref={toast} />
            <MenuBar/>
            <h1 className="text-black text-lg font-bold mx-3 mt-2 px-2 pt-1 text-center">parrot</h1>
            <h3 className='text-grey text-sm italic text-center mb-3'>contact manager</h3>

            <Toolbar className='p-2 mx-3 rounded-xl' 
                start={<h3 className='font-bold pl-2'>Contacts</h3>}
                end={ <React.Fragment>
                    <Button className='m-1' icon="pi pi-plus" onClick={() => setEdit(true)} rounded text raised/>
                    <Button className='m-1 text-red-400' icon="pi pi-trash" onClick={deleteContact} rounded text raised/>
                </React.Fragment>
                }
            />
            <DataTable value={contacts} selectionMode="single" selection={selected} className='mx-3' loading={loading}
            onSelectionChange={(e) => setSelected(e.value)} sortField='last_name' sortOrder={1} scrollable scrollHeight='400px' >
                <Column field='first_name' header='First Name' sortable filter/>
                <Column field='last_name' header='Last Name' sortable filter/>
                <Column field='tags_string' header='Tags' sortable filter/>
                <Column field='date' header='Date' body={dateTemplate} sortable/>
                <Column field='interactions_preview' header='Interactions' filter/>
                <Column body={(value) => editButtonTemplate(value)} />
            </DataTable>
            <Dialog header="Contact" visible={edit} className='min-w-max' onHide={clearDialog}>
                <div class='flex flex-col'>
                    <div className='flex flex-row py-2 items-center'>
                        <p>First Name: </p>
                        <InputText value={fname} placeholder='First Name' onChange={(e) => setFname(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Last Name: </p>
                        <InputText value={lname} placeholder='Last Name' onChange={(e) => setLname(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Tags: </p>
                        <InputText value={tags} placeholder='Tags' onChange={(e) => setTags(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Contact Info: </p>
                        <InputTextarea value={conts} placeholder='Contact Info' onChange={(e) => setConts(e.target.value)} rows={2} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Birth Date: </p>
                        <Calendar value={date} onChange={(e) => setDate(e.value)} className='ml-3 flex-1'/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Interactions: </p>
                        <InputTextarea value={interactions} placeholder='Interactions' onChange={(e) => setInteractions(e.target.value)} rows={4} className='ml-3 flex-1'/>
                    </div>
                    <Button label='Submit' onClick={addContact} />
                </div>
            </Dialog>
        </PrimeReactProvider>
    );
}

/*
Name (First, Last)
Birthday
Tags: array
Contact: phone number, email, messenger, etc (array)
Interactions: array of (date, string)

*/