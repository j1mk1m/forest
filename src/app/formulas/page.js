'use client';
import React from 'react';
import { useState, useEffect } from 'react';

import { PrimeReactProvider, PrimeReactContext, PrimeIcons } from 'primereact/api';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Divider } from 'primereact/divider';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Password } from 'primereact/password';
import 'primereact/resources/themes/mira/theme.css';
import 'primeicons/primeicons.css';

import MenuBar from '@/app/_components/menubar';
import { db, auth } from '@/app/page';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function Page () {
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
    const [formForm, setFormForm] = useState("");
    const [formDetails, setFormDetails] = useState("");
    const [formLink, setFormLink] = useState("");
    const [editingId, setEditingId] = useState(null);

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
        } catch (error){
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
            return (<i className="pi pi-check" style={{ color: 'slateblue' }}></i>);
        } else {
            return (<i className="pi pi-times" style={{ color: 'red' }}></i>);
        }
    }

    const editFormula = (item) => {
        setEditingId(item.id);
        setFormName(item.name);
        setFormDetails(item.details);
        setFormTags(item.tags);
        setFormForm(item.formula);
        setFormLink(item.link);
        setEditForm(true);
    }

    const editButtonTemplate = (value) => {
        return (
            <Button icon="pi pi-pencil" onClick={() => editFormula(value)} />
        )
    }

    const addVar = async () => {
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
        } catch (error) { 
            console.log(error);
        }
    }

    const addForm = async () => {
        try {
            const data = {
                name: formName,
                tags: formTags,
                details: formDetails,
                formula: formForm,
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
            setFormForm("");
            setFormTags("");
            setEditForm(false);
            setEditingId(null);
            updateFormula();
        } catch (error) { 
            console.log(error);
        }
    }

    const deleteVar = async () => {
        if (selectedVar) {
            try {
                await deleteDoc(doc(db, "variables", selectedVar.id));
                setVariables(variables.filter((doc) => doc.id != selectedVar.id));
            } catch (error) {
                console.log(error);
            }
        }
    }

    const deleteForm = async () => {
        if (selectedForm) {
            try {
                await deleteDoc(doc(db, "formulas", selectedForm.id));
                setFormulas(formulas.filter((doc) => doc.id != selectedForm.id));
            } catch (error) {
                console.log(error);
            }
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <PrimeReactProvider>
            <MenuBar/>
            <h1 className="text-black m-5 text-center">Formulas</h1>
            <Card header="Variables" className='m-5 p-3'>
                <Toolbar 
                    end={ <React.Fragment>
                        <Button className='bg-inherit' icon="pi pi-plus" onClick={() => setEditVar(true)}/>
                        <Button className='bg-ref' icon="pi pi-trash" onClick={deleteVar}/>
                    </React.Fragment>
                    }
                />
                <DataTable value={variables} selectionMode="single" selection={selectedVar}
                onSelectionChange={(e) => setSelectedVar(e.value)} paginator rows={10}>
                    <Column field='name' header='Name' sortable filter/>
                    <Column field='type' header='Type' sortable filter/>
                    <Column field='truthValue' header='Have' body={truthValueTemplate} sortable filter/>
                </DataTable>
            </Card>
            <Card header="Formulas" className='m-5 p-3'>
                <Toolbar 
                    end={ <React.Fragment>
                        <Button className='bg-inherit' icon="pi pi-plus" onClick={() => setEditForm(true)}/>
                        <Button className='bg-ref' icon="pi pi-trash" onClick={deleteForm}/>
                    </React.Fragment>
                    }
                />
                <DataTable value={formulas} selectionMode="single" selection={selectedForm}
                onSelectionChange={(e) => setSelectedForm(e.value)} paginator rows={10}>
                    <Column field='name' header='Name' sortable filter/>
                    <Column field='tags' header='Tags' filter/>
                    <Column field='formula' header='Formula'/>
                    <Column field='details' header='Details'/>
                    <Column field='link' header='Link'/>
                    <Column field='canMake' header="Can Make" body={boolTemplate} sortable/>
                    <Column body={(value) => editButtonTemplate(value)} />
                </DataTable>
            </Card>
            <Dialog header="Variable" visible={editVar} style={{ width: '50vw'}} onHide={() => setEditVar(false)}>
                <div class='flex flex-col'>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Name: </p>
                        <InputText value={varName} placeholder='Name' onChange={(e) => setVarName(e.target.value)} className="ml-3"/>
                    </div>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Type: </p>
                        <InputText value={varType} placeholder='Type' onChange={(e) => setVarType(e.target.value)} className="ml-3"/>
                    </div>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Truth Value: </p>
                        <InputSwitch checked={varTruth} onChange={(e) => setVarTruth(e.value)} className="ml-3"/>
                    </div>
                    <Button label='Submit' onClick={addVar} />
                </div>
            </Dialog>
            <Dialog header="Formula" visible={editForm} style={{ width: '50vw'}} onHide={() => setEditForm(false)}>
                <div class='flex flex-col'>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Name: </p>
                        <InputText value={formName} placeholder='Name' onChange={(e) => setFormName(e.target.value)} className="ml-3"/>
                    </div>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Tags: </p>
                        <InputText value={formTags} placeholder='Type' onChange={(e) => setFormTags(e.target.value)} className="ml-3"/>
                    </div>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Formula: </p>
                        <InputText value={formForm} placeholder='Type' onChange={(e) => setFormForm(e.target.value)} className="ml-3"/>
                    </div>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Details: </p>
                        <InputText value={formDetails} placeholder='Type' onChange={(e) => setFormDetails(e.target.value)} className="ml-3"/>
                    </div>
                    <div class='flex flex-row py-2 items-center'>
                        <p>Link: </p>
                        <InputText value={formLink} placeholder='Type' onChange={(e) => setFormLink(e.target.value)} className="ml-3"/>
                    </div>
                    <Button label='Submit' onClick={addForm} />
                </div>
            </Dialog>
        </PrimeReactProvider>
    );
}