import * as React from "react"

const Tabs = ({ defaultValue, value, onValueChange, className, children }: any) => (
  <div className={className} data-value={value || defaultValue}>
    {children}
  </div>
)

const TabsList = ({ className, children }: any) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className || ''}`}>
    {children}
  </div>
)

const TabsTrigger = ({ value, className, children, ...props }: any) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:shadow-sm ${className || ''}`}
    data-value={value}
    {...props}
  >
    {children}
  </button>
)

const TabsContent = ({ value, className, children }: any) => (
  <div className={`mt-2 ${className || ''}`} data-value={value}>
    {children}
  </div>
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
