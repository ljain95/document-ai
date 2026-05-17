"use client";

interface ChooseWhenProps{
    children : any
  }
  interface WhenProps{
    condition? : boolean,
    children : any
  }
  
  function Choose({ children }:ChooseWhenProps) {
    let Other = undefined;
    let When: any = undefined;
    children.forEach((element : any) => {
      if (element.type === Otherwise) {
        Other = element;
      } else {
        if (!When && element.props.condition) {
          When = element;
        }
      }
    });
    let Render = When || Other;
    return <>{Render}</>;
  }
  
  function When({ children }:WhenProps) {
    return <>{children}</>;
  }
  
  function Otherwise({ children }:ChooseWhenProps) {
    return <>{children}</>;
  }
  
  export { Choose, When, Otherwise };