import React from "react";
import { useState ,useEffect } from "react";
import Plats from "./Plats";
function Categories(){
const [data , setdata] = useState([])

useEffect(()=>{
    fetch('http://jhjhjh')
    .then(())
})
    return(
        <>
        <Plats/>
        </>
    )
}