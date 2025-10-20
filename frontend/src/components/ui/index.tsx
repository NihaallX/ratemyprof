import * as React from "react"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const Select = ({ children, ...props }: any) => <div {...props}>{children}</div>
const SelectContent = ({ children, ...props }: any) => <div {...props}>{children}</div>
const SelectItem = ({ children, ...props }: any) => <option {...props}>{children}</option>
const SelectTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>
const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>

const ScrollArea = ({ children, className }: any) => <div className={`overflow-auto ${className || ''}`}>{children}</div>

const Dialog = ({ children }: any) => <div>{children}</div>
const DialogContent = ({ children, className }: any) => <div className={`fixed z-50 bg-white p-6 shadow-lg ${className || ''}`}>{children}</div>
const DialogHeader = ({ children }: any) => <div>{children}</div>
const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold">{children}</h2>
const DialogTrigger = ({ children }: any) => <div>{children}</div>

const Separator = ({ className }: any) => <hr className={`border-gray-200 ${className || ''}`} />

const Alert = ({ children, className }: any) => <div className={`rounded-lg border p-4 ${className || ''}`}>{children}</div>
const AlertDescription = ({ children }: any) => <div className="text-sm">{children}</div>

export { 
  Input, 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  ScrollArea,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Separator,
  Alert, AlertDescription
}
