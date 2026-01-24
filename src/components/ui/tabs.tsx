import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }
>(({ className, defaultValue, children, ...props }, ref) => {
    // Basic context could be added here if needed for deeper nesting, 
    // but for this simple use case we'll rely on state in the parent or simple CSS toggling if we were using Headless UI.
    // However, since we need to switch content, we actually need context.
    // Let's implement a simple version using React State.

    // Actually, to keep it simple and creating a file from scratch without dependencies:
    const [selected, setSelected] = React.useState(defaultValue || "");

    // Clone children to pass setSelected and selected
    // const childrenWithProps = React.Children.map(children, child => {
    //    if (React.isValidElement(child)) {
    //        return React.cloneElement(child, { selected, onSelect: setSelected } as any);
    //    }
    //    return child;
    // });

    return (
        <div ref={ref} className={cn("", className)} {...props}>
            {/* We need a Context or just map children. Mapping is easier for a single file component without external deps */}
            <TabsContext.Provider value={{ selected, setSelected }}>
                {children}
            </TabsContext.Provider>
        </div>
    )
})
Tabs.displayName = "Tabs"

const TabsContext = React.createContext<{ selected: string, setSelected: (v: string) => void } | null>(null);

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isSelected = context?.selected === value;

    return (
        <button
            ref={ref}
            type="button"
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50",
                className
            )}
            onClick={() => context?.setSelected(value)}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (context?.selected !== value) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
