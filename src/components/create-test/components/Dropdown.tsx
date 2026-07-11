import { useState, type ReactNode } from "react";

interface params{
    label: string,
    children : ReactNode,
    defaultOpen?: boolean
}

export  function Dropdown({label, children, defaultOpen = false}:params){
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div onClick={()=> setOpen(!open)} className="bg-white shadow-[0_0_4px_0_#00000026] hover:cursor-pointer rounded-2xl p-5 max-w-[1200px] flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-(--text-app-primary) font-medium text-[1.125rem]">{label}</h1>
                <button onClick={()=>setOpen(!open)} className="hover:cursor-pointer bg-(--btn-primary) h-6 w-6 flex items-center justify-center rounded-[4px] text-white">
                    {!open ? (<img loading="lazy" decoding="async" src="/chevrondown.svg" alt="chevron-right" className="rotate-270"/> ) : (<img loading="lazy" decoding="async" src="/chevrondown.svg" alt="chevron-down"/>)
                    }
                </button>
            </div>

            {open && 
            <div onClick={(e)=>e.stopPropagation()}>
                {children}
            </div>
            }
            
        </div>
    );
}