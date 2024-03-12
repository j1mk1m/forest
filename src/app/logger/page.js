'use client';
import React, { useRef, useState, useEffect } from 'react';

import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Divider } from 'primereact/divider';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Fieldset } from 'primereact/fieldset';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Password } from 'primereact/password';
import 'primeicons/primeicons.css';

import MenuBar from '@/app/_components/menubar';

import { db, auth } from '@/app/page';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { classNames } from 'primereact/utils';


export default function Home() {
    const toast = useRef(null);
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    const [weekOf, setWeekOf] = useState(today);
    const [logs, setLogs] = useState([]);
    const [items, setItems] = useState([]);
    const [editItemVisible, setEditItemVisible] = useState(false);
    const [editLogVisible, setEditLogVisible] = useState(false);
    const [itemName, setItemName] = useState("");
    const [itemDesc, setItemDesc] = useState("");
    const [itemCat, setItemCat] = useState("");
    const [itemBool, setItemBool] = useState(false);
    const [logName, setLogName] = useState("");
    const [logDesc, setLogDesc] = useState("");
    const [logItem, setLogItem] = useState(null);
    const [logDate, setLogDate] = useState(today);
    const [logNumber, setLogNumber] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const updateItems = (logs, newDate) => {
        setItems(items.map((doc) => {
            const predicate = (value, index) => {
                return value.Item.id == doc.id;
            }
            const thisLogs = logs.filter(predicate);
            let week = {};
            for (let day = 0; day < 7; day++) {
                const date = new Date(newDate.getTime() + day * 24*60*60*1000);
                week[day] = (thisLogs.filter((value, index) => {
                        return value.Date.seconds * 1000 == date.getTime();
                    }).length > 0);
            }
            return {...doc, ...week};
        }));
    }

    const fetchData = async () => {
        let date = new Date();
        date.setHours(0, 0, 0, 0);
        const dif = (date.getDay() + 6) % 7;
        const newDate = new Date(date.getTime() - dif * 24 * 60 * 60 * 1000);
        try {
            const logDocs = await getDocs(collection(db, "logs"));
            const newLogs = logDocs.docs.map((doc) => ({...doc.data(), id:doc.id}));
            const itemDocs = await getDocs(collection(db, "log_items"));
            const newItems = itemDocs.docs.map((doc) => ({...doc.data(), id:doc.id}));
            setLogs(newLogs.map((doc) => {
                const filtered = newItems.filter((value) => value.id == doc.Item.id)[0];
                const item = filtered ? filtered.Name : "None";
                return ({
                    ...doc,
                    item: item
                });
            }));
            setItems(newItems.map((doc) => {
                const predicate = (value, index) => {
                    return value.Item.id == doc.id;
                }
                const thisLogs = newLogs.filter(predicate);
                let week = {};
                for (let day = 0; day < 7; day++) {
                    const date = new Date(newDate.getTime() + day * 24*60*60*1000);
                    week[day] = (thisLogs.filter((value, index) => {
                            return value.Date.seconds * 1000 == date.getTime();
                        }).length > 0);
                }
                return {...doc, ...week};
            }));
            setWeekOf(newDate);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch data' }); 
            console.log(error);
        }
    }

    const dateTemplate = (value) => {
        if (value.Date.seconds) {
            const date = new Date(value.Date.seconds * 1000);
            return date.toDateString();
        } else {
            return value.Date.toDateString();
        }
    }
    
    const boolTemplate = (value, date) => {
        if (value[date]) {
            return (<i className="pi pi-check" style={{ color: 'slateblue' }}></i>);
        } else {
            return (<i className="pi pi-times" style={{ color: 'red' }}></i>);
        }
    }

    const editItem = (item) => {
        setEditingId(item.id);
        setItemName(item.Name);
        setItemDesc(item.Description);
        setItemCat(item.Category);
        setItemBool(item.boolOrNum);
        setEditItemVisible(true);
    }

    const editButtonTemplate = (value) => {
        return (
            <Button icon="pi pi-pencil" onClick={() => editItem(value)} rounded text raised />
        )
    }

    const editLog = (item) => {
        setEditingId(item.id);
        setLogName(item.Name);
        setLogDesc(item.Description);
        setLogDate(item.Date);
        setLogItem(item.item);
        setLogNumber(item.Number);
        setEditLogVisible(true);
    }

    const editButtonLogTemplate = (value) => {
        return (
            <Button icon="pi pi-pencil" onClick={() => editLog(value)} rounded text raised />
        );
    }

    const goBackWeek = () => {
        const newDate = new Date(weekOf.getTime() - 7 * 24 * 60 * 60 * 1000);
        setWeekOf(newDate);
        updateItems(logs, newDate);
    }

    const goForwardWeek = () => {
        const newDate = new Date(weekOf.getTime() + 7 * 24 * 60 * 60 * 1000);
        setWeekOf(newDate);
        updateItems(logs, newDate);
    }
    
    const addItem = async () => {
        if (itemName == "") {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Name field is required' });
            return;
        }
        try {
            const data = {
                Name: itemName,
                Description: itemDesc,
                Category: itemCat,
                boolOrNum: itemBool
            };
            if (editingId) {
                await setDoc(doc(db, "log_items", editingId), data);
                items[items.findIndex((doc) => doc.id == editingId)] = {...data, id:editingId};
            } else {
                const ret = await addDoc(collection(db, "log_items"), data);
                items.push({...data, id: ret.id});
            }
            setItems(items);
            setItemName("");
            setItemDesc("");
            setItemCat("");
            setItemBool(false);
            setEditItemVisible(false);
            if (editingId) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Item Successfully Edited!' });
            } else {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Item Successfully Added!' });
            }
            setEditingId(null);
        } catch (error) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not add Item' });
            console.log(error);
        }
    }

    const addLog = async () => {
        if (logName == "") {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Name field is required' });
            return;
        }
        try {
            const data = {
                Name: logName,
                Description: logDesc,
                Item: doc(db, "log_items", items.filter((value) => value.Name == logItem)[0].id),
                Date: logDate,
                Number: logNumber
            };
            if (editingId) {
                await setDoc(doc(db, "logs", editingId), data);
                logs[logs.findIndex((doc) => doc.id == editingId)] = {...data, item: logItem, id:editingId};
            } else {
                const ret = await addDoc(collection(db, "logs"), data);
                logs.push({...data, item: logItem, id: ret.id});
            }
            setLogs(logs);
            updateItems(logs, weekOf);
            setLogName("");
            setLogDesc("");
            let today = new Date();
            today.setHours(0, 0, 0, 0);
            setLogDate(today);
            setLogItem("");
            setLogNumber(1);
            setEditLogVisible(false);
            if (editingId) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Log Successfully Edited!' });
            } else {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Log Successfully Added!' });
            }
            setEditingId(null);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not add Log' });
            console.log(error);
        }
    }

    const deleteItem = async () => {
        if (selectedItem) {
            try {
                await deleteDoc(doc(db, "log_items", selectedItem.id));
                setItems(items.filter((doc) => doc.id != selectedItem.id));
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Item Successfully Deleted!' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not delete Item' });
                console.log(error);
            }
        }
    }
    const deleteLog = async () => {
        if (selectedLog) {
            try {
                await deleteDoc(doc(db, "logs", selectedLog.id));
                const newLogs = logs.filter((doc) => doc.id != selectedLog.id)
                setLogs(newLogs);
                updateItems(newLogs, weekOf);
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Log Successfully Deleted!' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not delete Log' });
                console.log(error);
            }
        }
    }

    const clearDialog = () => {
        setItemName("");
        setItemBool(false);
        setItemCat("");
        setItemDesc("");
        setLogName("");
        setLogDate(today);
        setLogDesc("");
        setLogItem(null);
        setLogNumber(0);
        setEditingId(false);
        setEditItemVisible(false);
        setEditLogVisible(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <PrimeReactProvider>
            <Toast ref={toast} />
            <MenuBar/>
            <h1 className="text-black text-lg font-bold mx-3 mt-2 px-2 pt-1 text-center">logger</h1>
            <h3 className='text-grey text-sm italic text-center mb-3'>log manager</h3>
            <Toolbar className='p-2 mx-3 rounded-xl'
                start={<h3 className='font-bold pl-2'>Calendar</h3>}
                center={<React.Fragment>
                        <Button icon="pi pi-angle-left" onClick={goBackWeek} className='mx-1' rounded text />
                        <p>Week of: {weekOf.toDateString()}</p>
                        <Button icon="pi pi-angle-right" onClick={goForwardWeek} className='mx-1' rounded text />
                    </React.Fragment>}
                end={<React.Fragment>
                    <Button className='mx-1' icon="pi pi-plus" onClick={() => setEditItemVisible(true)} rounded text raised />
                    <Button className='mx-1 text-red-400' icon="pi pi-trash" onClick={deleteItem} rounded text raised />
                </React.Fragment>}
            />
            <DataTable value={items} selectionMode="single" selection={selectedItem} className='mx-3'
                onSelectionChange={(e) => setSelectedItem(e.value)} scrollable scrollHeight='400px' sortField='Category' sortOrder={1}>
                <Column field="Name" sortable header="Name"></Column>
                <Column field="Category" sortable header="Category" filter filterField='Category'></Column>
                {/* <Column field="Description" sortable header="Description"></Column>" */}
                <Column field="0" header="Mon" body={(value) => boolTemplate(value, "0")}></Column>
                <Column field="1" header="Tue" body={(value) => boolTemplate(value, "1")}></Column>
                <Column field="2" header="Wed" body={(value) => boolTemplate(value, "2")}></Column>
                <Column field="3" header="Thu" body={(value) => boolTemplate(value, "3")}></Column>
                <Column field="4" header="Fri" body={(value) => boolTemplate(value, "4")}></Column>
                <Column field="5" header="Sat" body={(value) => boolTemplate(value, "5")}></Column>
                <Column field="6" header="Sun" body={(value) => boolTemplate(value, "6")}></Column>
                <Column body={(value) => editButtonTemplate(value)} />
            </DataTable>
            <Toolbar start={<h3 className='pl-2 font-bold'>Logs</h3>} className='p-2 mx-3 mt-3 rounded-xl'
                end={ <React.Fragment>
                    <Button className='mx-1' icon="pi pi-plus" onClick={() => setEditLogVisible(true)} rounded text raised/>
                    <Button className='mx-1 text-red-400' icon="pi pi-trash" onClick={deleteLog} rounded text raised />
                </React.Fragment>
                }
            />
            <DataTable className='mx-3 my-0' value={logs} selectionMode="single" selection={selectedLog}
                onSelectionChange={(e) => setSelectedLog(e.value)} paginator rows={15} sortField='Date' sortOrder={-1}>
                <Column field="Name" sortable header="Name"></Column>
                <Column field="item" sortable header="Item" filter filterField='item'></Column>
                <Column field="Date" sortable header="Date" body={dateTemplate}></Column>
                <Column field="Number" header="Number"></Column>
                <Column body={(value) => editButtonLogTemplate(value)} />
            </DataTable>
            {/* Edit Item and Log Popups */}
            <Dialog header="Item" visible={editItemVisible} className='min-w-max' onHide={clearDialog}>
                <div class='flex flex-col'>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Name: </p>
                        <InputText value={itemName} placeholder='Name' onChange={(e) => setItemName(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Category: </p>
                        <InputText value={itemCat} placeholder='Category' onChange={(e) => setItemCat(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Description: </p>
                        <InputTextarea value={itemDesc} placeholder='Description' onChange={(e) => setItemDesc(e.target.value)} rows={5} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p className='flex-1'>Bool Or Number: </p>
                        <InputSwitch checked={itemBool} onChange={(e) => setItemBool(e.value)} className="ml-3"/>
                    </div>
                    <Button label='Submit' onClick={addItem} />
                </div>
            </Dialog>
            <Dialog header="Log" visible={editLogVisible} className='min-w-max' onHide={clearDialog}>
                <div class='flex flex-col'>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Name: </p>
                        <InputText value={logName} placeholder='Name' onChange={(e) => setLogName(e.target.value)} className='ml-3 flex-1' />
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Item: </p>
                        <Dropdown value={logItem} onChange={(e) => setLogItem(e.value)} options={items.map((doc) => doc.Name)} placeholder='Pick Item' className='ml-3 flex-1'/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Date: </p>
                        <Calendar value={logDate} onChange={(e) => setLogDate(e.value)} className='ml-3 flex-1'/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Number: </p>
                        <InputNumber value={logNumber} onChange={(e) => setLogNumber(e.value)} className='ml-3 flex-1'/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Description: </p>
                        <InputTextarea value={logDesc} placeholder='Description' onChange={(e) => setLogDesc(e.target.value)} rows={3} className='ml-3 flex-1'/>
                    </div>
                <Button label='Submit' onClick={addLog} />
                </div>
            </Dialog>
        </PrimeReactProvider>
    );
}
