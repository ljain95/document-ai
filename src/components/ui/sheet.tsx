"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

const Sheet = SheetPrimitive.Root;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }: { className?: string }, ref: any) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 bg-white shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 dark:bg-slate-950",
  {
    variants: {
      side: {
        modal: "inset-0 md:inset-x-48 md:inset-y-24 border-0 md:border md:data-[state=closed]:slide-out-to-top  md:data-[state=open]:slide-in-from-top",
        full: "inset-0 md:inset-12 border-0 md:border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        sidepane: "inset-y-4 right-4 rounded-lg  w-full sm:w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md md:max-w-2xl",
        left: "inset-y-0 right-0 h-full  w-full sm:w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md md:max-w-2xl",
      },
    },
    defaultVariants: {
      side: "sidepane",
    },
  },
);


interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> {
}


const SheetContent = React.forwardRef(
  ({ className, children, close, ...props }: SheetContentProps & { close?: () => void }, ref: any) => {
    const [side] = React.useState<"modal" | "left" | "full" | "sidepane" | null | undefined>('sidepane')
    return <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={
          cn(sheetVariants({ side }), className, "overflow-y-auto", "transition-all duration-75")
        }
        {...props}
      >
        <div className="absolute top-6 z-50 flex flex-row left-6">
          <div onClick={close}
            className="ring-offset-white cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 dark:ring-offset-slate-950 dark:focus:ring-slate-300 dark:data-[state=open]:bg-slate-800">
            <XIcon size={24} />
          </div>
        </div>
        <div autoFocus className="flex flex-col h-[calc(100vh-2rem)]">
          {children}
        </div>
      </SheetPrimitive.Content>
    </SheetPortal>

  })

SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, children, ...props }: { className?: string, children: any }) => (
  <div
    className={cn(
      "flex flex-col space-y-2 px-10 py-8 text-left",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, children, ...props }: { className?: string, children?: any }) => (
  <div
    className={cn(
      "flex flex-row px-10 py-6 border-t theme-bg",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef(({ className, children, ...props }: {
  className?: string,
  children: any
}, ref: any) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl mt-6 font-semibold text-color dark:text-slate-50",
      className,
    )}
    {...props}
  >
    {children}
  </SheetPrimitive.Title>
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef(({ className, children, ...props }: {
  className?: string,
  children?: any
}, ref: any) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm", className)}
    {...props}
  >
    {children}
  </SheetPrimitive.Description>
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};