"use client";

interface ForProps{
    data : any[],
    render : Function
}

export default function For({data,render}:ForProps){
    return (
        <>
            {data.map((item,index)=>{
                let Component = ()=> render(item,index)
                return <Component key={index}/>
            })}
        </>
    )
}