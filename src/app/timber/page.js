'use client';
import React, { useRef, useState, useEffect } from 'react';

import { PrimeReactProvider } from 'primereact/api';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { InputTextarea } from 'primereact/inputtextarea';
import 'primeicons/primeicons.css';
import MenuBar from '@/app/_components/menubar';

import { db } from '@/app/page';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const alpha = 1.5;
const beta = 3;

export default function Page () {
    const toast = useRef(null);

    let today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todos, setTodos] = useState([]);
    const [editVisible, setEditVisible] = useState(false);
    const [logTaskVisible, setLogTaskVisible] = useState(false);
    const [selected, setSelected] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [desc, setDesc] = useState("");
    const [timetoc, setTimetoc] = useState(1);
    const [priority, setPriority] = useState(0);
    const [duedate, setDuedate] = useState(today);
    const [sesTime, setSesTime] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const todoDocs = await getDocs(collection(db, "tasks"));
            const newTodos = todoDocs.docs.map((doc) => {
                const data = doc.data();
                return {...data,
                    id: doc.id,
                    score: getScore(data.time_to_complete, data.due_date, data.priority)
                }
            });
            setTodos(newTodos);
            setLoading(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch data' }); 
            console.log(error);
        }
    }

    const getScore = (time_remaining, due_date, priority) => {
        const days_remaining = (((due_date instanceof Date ? due_date.getTime() : due_date.seconds * 1000) - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return alpha * time_remaining / days_remaining + beta * Math.max(3 - days_remaining, 0) + priority;
    }

    const addTodo = async () => {
        if (name == "") {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Name field is required' });
            return;
        }
        if (duedate == null) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Due Date field is required' });
            return;
        }
        if (timetoc == null) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Time2Complete field is required' });
            return;
        }
        if (timetoc < 0) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Time2Complete must be non-negative' });
            return;
        }
        if (priority == null) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Priority field is required' });
            return;
        }
        if (priority < 0 || priority > 5) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Priority must be between 0 and 5 inclusive' });
            return;
        }
        try {
            const data = {
                name: name,
                description: desc,
                category: category,
                priority: priority,
                time_to_complete: timetoc,
                due_date: duedate
            };
            if (editingId) {
                await setDoc(doc(db, "tasks", editingId), data);
                todos[todos.findIndex((doc) => doc.id == editingId)] = {...data, 
                    id: editingId,
                    score: getScore(timetoc, duedate, priority)
                };
            } else {
                const ret = await addDoc(collection(db, "tasks"), data);
                todos.push({...data, id: ret.id, score: getScore(timetoc, duedate, priority)});
            }
            setTodos(todos);
            clearDialog();
            if (editingId) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'To Do Successfully Edited!' });
            } else {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'To Do Successfully Added!' });
            }
        } catch (error) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not add To Do item' });
            console.log(error);
        }
    }

    const editTodo = (value) => {
        setName(value.name);
        setDesc(value.description);
        setCategory(value.category);
        if (value.due_date.seconds) {
            const newdate = new Date(value.due_date.seconds * 1000);
            setDuedate(newdate);
        } else {
            setDuedate(value.due_date);
        }
        setPriority(value.priority);
        setTimetoc(value.time_to_complete);
        setEditingId(value.id);
        setEditVisible(true);
    }

    const checkTask = async () => {
        try {
            if (sesTime == null || sesTime <= 0) {
                toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Session Time should be positive' });
                return;
            }
            const value = todos.filter((todo) => todo.id == editingId)[0];
            const time_remaining = value.time_to_complete - sesTime;
            if (time_remaining == 0) {
                await doneTodo();
                return;
            }
            await updateDoc(doc(db, "tasks", value.id), {time_to_complete: time_remaining});
            const newTodos = todos.map((item) => {
                if (item.id == value.id) {
                    return {...item, 
                        time_to_complete: time_remaining,
                        score: getScore(time_remaining, item.due_date, item.priority)
                    };
                } else {
                    return item;
                }
            });
            setTodos(newTodos);
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Logged ' + sesTime + ' hours!' });
            clearDialog();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not log hours' });
            console.log(error);
        }
    }

    const doneTodo = async () => {
        try {
            await deleteDoc(doc(db, "tasks", editingId));
            const newTodos = todos.filter((item) => item.id != editingId);
            setTodos(newTodos);
            clearDialog();
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'To Do Checked Off!' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not check off To Do' });
            console.log(error);
        }
    }

    const editButtonTemplate = (value) => {
        return (
            <div className='flex flex-row'>
                <Button icon="pi pi-pencil" onClick={() => editTodo(value)} className='mr-2' rounded text raised />
                <Button icon="pi pi-check" onClick={() => openLogTask(value)} rounded text raised />
            </div>
        )
    }

    const openLogTask = (value) => {
        setEditingId(value.id);
        setLogTaskVisible(true);
    }

    const deleteTodo = async () => {
        if (selected) {
            try {
                await deleteDoc(doc(db, "tasks", selected.id));
                const newTodos = todos.filter((doc) => doc.id != selected.id);
                setTodos(newTodos);
                setSelected(null);
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'To Do item Successfully Deleted!' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not delete To Do item' });
                console.log(error);
            }
        }
    }

    const clearDialog = () => {
        setName("");
        setDesc("");
        setCategory("");
        setDuedate(today);
        setPriority(0);
        setTimetoc(1);
        setSesTime(1);
        setEditingId(null);
        setEditVisible(false);
        setLogTaskVisible(false);
    }

    const dateTemplate = (value) => {
        if (value.due_date.seconds) {
            const date = new Date(value.due_date.seconds * 1000);
            return date.toDateString();
        } else {
            return value.due_date.toDateString();
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <PrimeReactProvider>
                 <div style={{minHeight: '100vh'}} className='justify-center items-center flex'>
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                 </div>
            </PrimeReactProvider>
        )
    }

    return (
        <PrimeReactProvider>
            <Toast ref={toast} />
            <MenuBar/>
            <h1 className="text-black text-lg font-bold mx-3 mt-2 px-2 pt-1 text-center">timber</h1>
            <h3 className='text-grey text-sm italic text-center mb-3'>task manager</h3>

            <Toolbar className='p-2 mx-3 mt-3 rounded-xl'
                start={<h3 className='font-bold pl-2'>To Dos</h3>}
                end={<React.Fragment>
                    <Button className='mx-1' icon="pi pi-plus" onClick={() => setEditVisible(true)} rounded text raised />
                    <Button className='mx-1 text-red-400' icon="pi pi-trash" onClick={deleteTodo} rounded text raised />
                </React.Fragment>}
            />
             <DataTable value={todos} selectionMode="single" selection={selected} className='mx-3' loading={loading}
                onSelectionChange={(e) => setSelected(e.value)} sortField='score' sortOrder={-1}>
                <Column field="name" sortable header="Name"></Column>
                <Column field="category" sortable header="Category" filter filterField='category'></Column>
                <Column field="due_date" sortable header="Date" body={dateTemplate}></Column>
                <Column field="time_to_complete" sortable header="Time2Complete"></Column>
                <Column field="priority" sortable header="Priority" ></Column>
                <Column field="score" sortable header="Score" ></Column>
                <Column body={(value) => editButtonTemplate(value)} />
            </DataTable>

            <Dialog header="How many hours?" visible={logTaskVisible} className='min-w-max' onHide={clearDialog}>
                <div class='flex flex-col'>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Session Time: </p>
                        <InputNumber value={sesTime} onChange={(e) => setSesTime(e.value)} className='ml-3 flex-1'/>
                    </div>
                    <div className='flex flex-row py-1 items-center'>
                        <Button label='Log' onClick={checkTask} className='flex-1'/>
                    </div>
                    <div className='flex flex-row items-center'>
                        <Button label='Mark Complete' onClick={doneTodo} className='flex-1 bg-green-800'/>
                    </div>
                </div>
            </Dialog>

            <Dialog header="To Do" visible={editVisible} className='min-w-max' onHide={clearDialog}>
                <div class='flex flex-col'>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Name: </p>
                        <InputText value={name} placeholder='Name' onChange={(e) => setName(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Category: </p>
                        <InputText value={category} placeholder='Category' onChange={(e) => setCategory(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Description: </p>
                        <InputTextarea value={desc} placeholder='Description' onChange={(e) => setDesc(e.target.value)} rows={5} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Due Date: </p>
                        <Calendar value={duedate} onChange={(e) => setDuedate(e.value)} className='ml-3 flex-1'/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Time to Complete: </p>
                        <InputNumber value={timetoc} onChange={(e) => setTimetoc(e.value)} className='ml-3 flex-1'/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Priority (0-5): </p>
                        <InputNumber value={priority} onChange={(e) => setPriority(e.value)} className='ml-3 flex-1'/>
                    </div>
                    <Button label='Submit' onClick={addTodo} />
                </div>
            </Dialog>
        </PrimeReactProvider>
    );
}
