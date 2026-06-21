import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination() {
    return (
        <div className="w-full px-6 md:px-8 border-t border-border flex flex-col justify-start items-start overflow-hidden pt-5">
            <div className="w-full inline-flex justify-between items-center gap-3">
                <div className="flex justify-start items-center">
                    <button className="flex justify-center items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity">
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        <span className="hidden sm:block text-muted-foreground text-sm font-medium leading-5">Previous</span>
                    </button>
                </div>
                
                <div className="flex justify-center items-center gap-1 sm:gap-2">
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 text-primary border border-primary/20 rounded-lg flex justify-center items-center text-sm font-medium transition-colors hover:bg-primary/20">
                        1
                    </button>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center text-muted-foreground text-sm font-medium transition-colors hover:bg-muted">
                        2
                    </button>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center text-muted-foreground text-sm font-medium transition-colors hover:bg-muted hidden sm:flex">
                        3
                    </button>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center text-muted-foreground text-sm font-medium hidden sm:flex cursor-default">
                        ...
                    </div>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center text-muted-foreground text-sm font-medium transition-colors hover:bg-muted hidden sm:flex">
                        8
                    </button>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center text-muted-foreground text-sm font-medium transition-colors hover:bg-muted">
                        9
                    </button>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex justify-center items-center text-muted-foreground text-sm font-medium transition-colors hover:bg-muted flex">
                        10
                    </button>
                </div>

                <div className="flex justify-end items-center">
                    <button className="flex justify-center items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity">
                        <span className="hidden sm:block text-muted-foreground text-sm font-medium leading-5">Next</span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </div>
    );
}
