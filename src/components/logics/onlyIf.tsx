"use client";

interface OnlyIfProps{
    children : any,
    condition : boolean
  }
  
  export default function OnlyIf({ condition = false, children } : OnlyIfProps) {
    if (condition) {
      return <>{children}</>;
    }
    return <></>;
  }