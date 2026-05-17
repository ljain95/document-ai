"use client";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function PageButton({title, icon, onClick,className}:{title:string, icon?:React.ReactNode, onClick:()=>void, className?:string}){
    return (
        <Button onClick={onClick} className={cn(className)}>
            {icon && icon}
            {title}
        </Button>
    )
}