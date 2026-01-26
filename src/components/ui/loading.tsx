import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

export function Loading({ className, text = "Carregando...", fullScreen = false }: LoadingProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium text-muted-foreground animate-pulse">{text}</p>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center justify-center py-10", className)}>
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
        </div>
    );
}
