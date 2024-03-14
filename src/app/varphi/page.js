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
import { ToggleButton } from 'primereact/togglebutton';
import { InputTextarea } from 'primereact/inputtextarea';
import 'primeicons/primeicons.css';

import MenuBar from '@/app/_components/menubar';
import { db, auth } from '@/app/page';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function Page () {
    const toast = useRef(null);
    const [formulas, setFormulas] = useState([]);
    const [variables, setVariables] = useState([]);
    const [selectedVar, setSelectedVar] = useState(null);
    const [selectedForm, setSelectedForm] = useState(null);
    const [editVar, setEditVar] = useState(false);
    const [editForm, setEditForm] = useState(false);
    const [varName, setVarName] = useState("");
    const [varType, setVarType] = useState("");
    const [varTruth, setVarTruth] = useState(false);
    const [formName, setFormName] = useState("");
    const [formTags, setFormTags] = useState("");
    const [formDetails, setFormDetails] = useState("");
    const [formLink, setFormLink] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [selectedVars, setSelectedVars] = useState([]);
    const [loading, setLoading] = useState(true);

    const updateFormula = () => {
        const nameArray = variables.filter((doc) => doc.truthValue).map((doc) => doc.name.toLowerCase());
        setFormulas(formulas.map((doc) => {
            const phi = doc.formula.split(',');
            for (let c of phi) {
                if (!nameArray.includes(c.trim().toLowerCase())) {
                    doc.canMake = false;
                    return doc;
                }
            }
            doc.canMake = true;
            return doc;
        }));
    }

    const fetchData = async () => {
        try {
            const varDocs = await getDocs(collection(db, "variables"));
            const newVars = varDocs.docs.map((doc) => ({...doc.data(), id: doc.id})); 
            const nameArray = newVars.filter((doc) => doc.truthValue).map((doc) => doc.name.toLowerCase());
            setVariables(newVars);
            const formulaDocs = await getDocs(collection(db, "formulas"));
            setFormulas(formulaDocs.docs.map((doc) => ({...doc.data(), id:doc.id})).map(
                (doc) => {
                    const phi = doc.formula.split(',');
                    for (let c of phi) {
                        if (!nameArray.includes(c.trim().toLowerCase())) {
                            return {...doc, canMake: false};
                        }
                    }
                    return {...doc, canMake:true};
                }
            ));
            setLoading(false);
        } catch (error){
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch data' });
            console.log(error);
        }
    }

    const truthValueChanged = async (e) => {
        try {
            await updateDoc(doc(db, 'variables', e.target.id), {truthValue: e.checked});
            const index = variables.findIndex((v) => v.id == e.target.id);
            variables[index].truthValue = e.checked;
            updateFormula();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not update Variable' });
            console.log(error);
        }
    }

    const truthValueTemplate = (value) => {
        return (
            <Checkbox id={value.id} checked={value.truthValue} onChange={truthValueChanged} />
        )
    }

    const boolTemplate = (value) => {
        if (value.canMake) {
            return (<i className="pi pi-check" style={{ color: 'green' }}></i>);
        } else {
            return (<i className="pi pi-times" style={{ color: 'red'}}></i>);
        }
    }

    const editFormula = (item) => {
        setEditingId(item.id);
        setFormName(item.name);
        setFormDetails(item.details);
        setFormTags(item.tags);
        setSelectedVars(item.formula.split(',').map((v) => v.trim()));
        setFormLink(item.link);
        setEditForm(true);
    }

    const editButtonTemplate = (value) => {
        return (
            <Button icon="pi pi-pencil" onClick={() => editFormula(value)} rounded text raised/>
        )
    }

    const addVar = async () => {
        if (varName == "") {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Name field is required' });
            return;
        }
        try {
            const data = {
                name: varName,
                type: varType,
                truthValue: varTruth
            };
            const ret = await addDoc(collection(db, "variables"), data);
            variables.push({...data, id:ret.id});
            setVariables(variables); 
            setVarName("");
            setVarType("");
            setVarTruth(false);
            setEditVar(false);
            updateFormula();
            toast.current.show({ severity: 'sucess', summary: 'Success', detail: 'Variable Successfully Added!' });
        } catch (error) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not add Variable' });
            console.log(error);
        }
    }

    const addForm = async () => {
        if (formName == "") {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Name field is required' });
            return;
        }
        try {
            const data = {
                name: formName,
                tags: formTags,
                details: formDetails,
                formula: selectedVars.join(', '),
                link: formLink,
            };
            if (editingId) {
                await setDoc(doc(db, "formulas", editingId), {...data, id:editingId});
                formulas[formulas.findIndex((doc) => doc.id == editingId)] = {...data, id:editingId};
            } else {
                const ret = await addDoc(collection(db, "formulas"), data);
                formulas.push({...data, id:ret.id});
            }
            setFormulas(formulas); 
            setFormName("");
            setFormDetails("");
            setFormLink("");
            setSelectedVars([]);
            setFormTags("");
            setEditForm(false);
            updateFormula();
            if (editingId) {
                toast.current.show({ severity: 'sucess', summary: 'Success', detail: 'Formula Successfully Edited!' });
            } else {
                toast.current.show({ severity: 'sucess', summary: 'Success', detail: 'Formula Successfully Added!' });
            }
            setEditingId(null);
        } catch (error) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not add Formula' });
            console.log(error);
        }
    }

    const deleteVar = async () => {
        if (selectedVar) {
            try {
                await deleteDoc(doc(db, "variables", selectedVar.id));
                setVariables(variables.filter((doc) => doc.id != selectedVar.id));
                setSelectedVar(null);
                toast.current.show({ severity: 'sucess', summary: 'Success', detail: 'Variable Successfully Deleted!' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not delete Variable' });
                console.log(error);
            }
        }
    }

    const deleteForm = async () => {
        if (selectedForm) {
            try {
                await deleteDoc(doc(db, "formulas", selectedForm.id));
                setFormulas(formulas.filter((doc) => doc.id != selectedForm.id));
                setSelectedForm(null);
                toast.current.show({ severity: 'sucess', summary: 'Success', detail: 'Formula Successfully Deleted!' });
            } catch (error) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not delete Formula' });
                console.log(error);
            }
        }
    }

    const clearDialog = () => {
        setVarName("");
        setVarType("");
        setVarTruth(false);
        setFormDetails("");
        setFormName("");
        setFormLink("");
        setFormTags("");
        setSelectedVars([]);
        setEditingId(null);
        setEditVar(false);
        setEditForm(false)
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
            <h1 className="text-black text-lg font-bold mx-3 mt-2 px-2 pt-1 text-center">varphi</h1>
            <h3 className='text-grey text-sm italic text-center mb-3'>formula manager</h3>
                <Toolbar className='p-2 mx-3 rounded-xl' 
                    start={<h3 className='font-bold pl-2'>Variables</h3>}
                    end={ <React.Fragment>
                        <Button className='m-1' icon="pi pi-plus" onClick={() => setEditVar(true)} rounded text raised/>
                        <Button className='m-1 text-red-400' icon="pi pi-trash" onClick={deleteVar} rounded text raised/>
                    </React.Fragment>
                    }
                />
                <DataTable value={variables} selectionMode="single" selection={selectedVar} className='mx-3' loading={loading}
                onSelectionChange={(e) => setSelectedVar(e.value)} sortField='type' sortOrder={1}>
                    <Column field='name' header='Name' sortable filter/>
                    <Column field='type' header='Type' sortable filter/>
                    <Column field='truthValue' header='T/F' body={truthValueTemplate} sortable filter/>
                </DataTable>
                <Toolbar className='p-2 mx-3 mt-3 rounded-xl'
                    start={<h3 className='pl-2 font-bold'>Formulas</h3>}
                    end={ <React.Fragment>
                        <Button className='m-1' icon="pi pi-plus" onClick={() => setEditForm(true)} rounded text raised/>
                        <Button className='m-1 text-red-400' icon="pi pi-trash" onClick={deleteForm} rounded text raised/>
                    </React.Fragment>
                    }
                />
                <DataTable value={formulas} selectionMode="single" selection={selectedForm} className='mx-3' loading={loading}
                onSelectionChange={(e) => setSelectedForm(e.value)} paginator rows={10} sortField='canMake' sortOrder={-1}>
                    <Column field='name' header='Name' sortable filter/>
                    <Column field='tags' header='Tags' sortable filter/>
                    <Column field='formula' header='Formula'/>
                    {/* <Column field='details' header='Details'/>
                    <Column field='link' header='Link'/> */}
                    <Column field='canMake' header="T/F" body={boolTemplate} sortable/>
                    <Column body={(value) => editButtonTemplate(value)} />
                </DataTable>
            <Dialog header="Variable" visible={editVar} className='min-w-max' onHide={clearDialog}>
                <div class='flex flex-col'>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Name: </p>
                        <InputText value={varName} placeholder='Name' onChange={(e) => setVarName(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Type: </p>
                        <InputText value={varType} placeholder='Type' onChange={(e) => setVarType(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <ToggleButton checked={varTruth} onChange={(e) => setVarTruth(e.value)} className="flex-1" onLabel='True' offLabel='False'/>
                    </div>
                    <Button label='Submit' onClick={addVar} />
                </div>
            </Dialog>
            <Dialog header="Formula" visible={editForm} className='min-w-max' onHide={clearDialog}>
                <div class='flex flex-col'>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Name: </p>
                        <InputText value={formName} placeholder='Name' onChange={(e) => setFormName(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Tags: </p>
                        <InputText value={formTags} onChange={(e) => setFormTags(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Formula: </p>
                        <MultiSelect value={selectedVars} onChange={(e) => setSelectedVars(e.value)} options={variables.map(v => v.name)}
                            placeholder="Select Variables" maxSelectedLabels={3} className="w-full md:w-20rem" filter/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Details: </p>
                        <InputTextarea value={formDetails} rows={3} onChange={(e) => setFormDetails(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <div className='flex flex-row py-2 items-center'>
                        <p>Link: </p>
                        <InputText value={formLink} onChange={(e) => setFormLink(e.target.value)} className="ml-3 flex-1"/>
                    </div>
                    <Button label='Submit' onClick={addForm} />
                </div>
            </Dialog>
        </PrimeReactProvider>
    );
}