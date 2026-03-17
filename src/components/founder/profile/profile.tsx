"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    MapPin,
    Phone,
    User,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
    const [activeTab, setActiveTab] = useState("personal");
    const [bio, setBio] = useState("Meet Alex, a passionate software developer with a knack for creating innovative solutions. With over five years of experience in the tech industry, Alex loves tackling complex challenges and collaborating with teams to bring ideas to life. When not coding, you can find Alex hiking or exploring new coffee shops.");

    return (
        <div className="w-full max-w-[1136px] mx-auto pb-12 px-4 md:px-0">
            {/* Main Container */}
            <div className="w-full bg-muted py-8 bg-card rounded-2xl shadow-[1px_2px_3px_0px_rgba(0,0,0,0.04)] shadow-[-2px_-1px_17px_0px_rgba(0,0,0,0.02)] outline outline-2 outline-offset-[-2px] outline-border flex flex-col justify-start items-start gap-6">
                <div className="self-stretch px-4 md:px-8 flex flex-col justify-start items-start gap-6">
                    <div className="self-stretch flex flex-col justify-start items-start gap-8">
                        {/* Header Section */}
                        <div className="w-full flex flex-col justify-start items-start gap-7">
                            <div className="flex flex-col justify-start items-start gap-1">
                                <div className="self-stretch text-foreground text-3xl font-medium font-['Inter Tight'] leading-10">
                                    Edit Profile
                                </div>
                                <div className="text-muted-foreground text-sm font-normal font-['Inter'] leading-5">
                                    Control your productivity system.
                                </div>
                            </div>

                            {/* Profile Image & Progress */}
                            <div className="self-stretch pb-6 border-b border-border/10 flex flex-col justify-center items-start gap-2">
                                <div className="inline-flex justify-start items-center gap-4">
                                    <div className="inline-flex flex-col justify-center items-center gap-1">
                                        <div className="w-28 h-28 relative">
                                            <Avatar className="w-28 h-28 border-[3px] border-border shadow-[0px_3px_60px_0px_rgba(0,0,0,0.02)]">
                                                <AvatarImage src="https://placehold.co/120x120" />
                                                <AvatarFallback className="bg-muted text-2xl font-bold">MJ</AvatarFallback>
                                            </Avatar>
                                            {/* Decorative element from snippet */}
                                            <div className="w-7 h-7 absolute right-0 bottom-3 overflow-hidden bg-primary rounded-full flex items-center justify-center border-2 border-background">
                                                <div className="w-3.5 h-3.5 bg-white/20 rounded-sm"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-row gap-4">
                                        <button className="text-blue-500 text-sm font-semibold font-['Inter'] leading-5 hover:underline decoration-2 underline-offset-4">
                                            Update
                                        </button>
                                        <button className="text-muted-foreground text-sm font-semibold font-['Inter'] leading-5 hover:text-foreground transition-colors">
                                            Public View
                                        </button>
                                    </div>
                                </div>

                                <div className="inline-flex flex-wrap justify-start items-center gap-2 mt-2">
                                    <div className="pl-3 pr-1 py-0.5 bg-blue-50 dark:bg-blue-950/30 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-blue-100 dark:outline-blue-900/50 flex justify-start items-center gap-[5px]">
                                        <div className="text-blue-500 text-xs font-semibold font-['Inter'] leading-5 uppercase tracking-wider">
                                            Mondial {activeTab === "personal" ? "60%" : "80%"}
                                        </div>
                                        <div className="w-5 h-5 relative overflow-hidden flex items-center justify-center">
                                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center gap-2">
                                        <div className="text-foreground text-sm font-normal font-['Inter'] leading-5">
                                            {activeTab === "personal" ? "Get a perfect score by following all the steps!" : "Just a few steps to 100%."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Section */}
                        <div className="self-stretch border-b border-border/10 flex flex-col justify-start items-start">
                            <div className="inline-flex justify-start items-start gap-3">
                                <button
                                    onClick={() => setActiveTab("personal")}
                                    className={cn(
                                        "px-1 pb-3 flex justify-center items-center gap-2 border-b-2 transition-all",
                                        activeTab === "personal" ? "border-blue-500 text-blue-500" : "border-transparent text-muted-foreground"
                                    )}
                                >
                                    <div className="text-sm font-semibold font-['Inter'] leading-5">Personal Info</div>
                                </button>
                                <button
                                    onClick={() => setActiveTab("professional")}
                                    className={cn(
                                        "px-1 pb-3 flex justify-center items-center gap-2 border-b-2 transition-all",
                                        activeTab === "professional" ? "border-blue-500 text-blue-500" : "border-transparent text-muted-foreground"
                                    )}
                                >
                                    <div className="text-sm font-medium font-['Inter'] leading-5">Professional Info</div>
                                </button>
                            </div>
                        </div>

                        {activeTab === "personal" ? (
                            <div className="self-stretch space-y-8 flex flex-col">
                                {/* Tab Header Info */}
                                <div className="self-stretch pb-6 border-b border-border/10 flex flex-col justify-center items-start gap-1 border-gray-200">
                                    <div className="self-stretch text-foreground text-lg font-semibold font-['Inter'] leading-7">
                                        Personal Info
                                    </div>
                                    <div className="self-stretch text-muted-foreground text-sm font-normal font-['Inter'] leading-5 line-clamp-1">
                                        Update your photo and personal details here.
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="self-stretch flex flex-col justify-start items-start gap-6 border-gray-200">
                                    {/* Full Name */}
                                    <div className="w-full lg:w-[824px] inline-flex flex-col md:flex-row justify-start items-start md:items-center gap-4 md:gap-8 flex-wrap">
                                        <div className="w-full md:w-72 text-foreground text-base md:text-sm font-medium font-['Inter'] leading-5">
                                            Full Name
                                        </div>
                                        <Input
                                            className="w-full md:w-[512px] h-12 flex-1 bg-card  border-border/50 rounded-lg text-sm font-['Inter']"
                                            defaultValue="Methen Jefer"
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="self-stretch inline-flex flex-col md:flex-row justify-start items-start gap-4 md:gap-8 flex-wrap bg-card">
                                        <div className="w-full md:w-72 text-foreground text-base md:text-sm font-medium font-['Inter'] leading-5 md:pt-3">
                                            Address
                                        </div>
                                        <div className="w-full md:w-[512px] inline-flex flex-col justify-start items-start gap-3">
                                            <div className="self-stretch px-3.5 py-3 bg-muted/40 rounded-lg border border-border/50 inline-flex justify-start items-center gap-2 overflow-hidden group">
                                                <div className="flex-1 flex justify-start items-center gap-3">
                                                    <div className="w-5 h-5 relative overflow-hidden flex items-center justify-center">
                                                        <span className="text-base">🇦🇺</span>
                                                    </div>
                                                    <div className="text-foreground text-base font-normal font-['Inter'] leading-6">Australia</div>
                                                </div>
                                                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
                                            </div>
                                            <Input
                                                className="w-full h-12 bg-muted/20 border-border/50 rounded-lg text-sm font-['Inter']"
                                                placeholder="Type City"
                                            />
                                            <Input
                                                className="w-full h-12 bg-muted/20 border-border/50 rounded-lg text-sm font-['Inter']"
                                                placeholder="Type full address"
                                            />
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div className="self-stretch inline-flex flex-col md:flex-row justify-start items-start gap-4 md:gap-8 flex-wrap bg-card">
                                        <div className="w-full md:w-72 text-foreground text-base md:text-sm font-medium font-['Inter'] leading-5 md:pt-3">
                                            Bio
                                        </div>
                                        <div className="w-full md:w-[512px] h-44 relative bg-muted/40 rounded-lg border border-border/50 shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-start items-start gap-1">
                                            <textarea
                                                className="flex-1 w-full bg-transparent border-none outline-none resize-none text-foreground text-sm font-normal font-['Inter'] leading-5"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                maxLength={1000}
                                            />
                                            <div className="absolute right-4 bottom-3 text-muted-foreground text-xs font-normal font-['Inter'] leading-5 bg-background/50 px-1 rounded">
                                                {bio.length}/1000
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="w-full lg:w-[824px] inline-flex flex-col md:flex-row justify-start items-start md:items-center gap-4 md:gap-8 flex-wrap">
                                        <div className="w-full md:w-72 text-foreground text-base md:text-sm font-medium font-['Inter'] leading-5">
                                            Phone
                                        </div>
                                        <Input
                                            className="w-full md:w-[512px] h-12 bg-muted/40 border-border/50 rounded-lg text-sm font-['Inter']"
                                            defaultValue="+099 093884885"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="self-stretch space-y-8 flex flex-col">
                                {/* Tab Header Info */}
                                <div className="self-stretch pb-6 border-b border-border/10 flex flex-col justify-center items-start gap-1">
                                    <div className="self-stretch text-foreground text-lg font-semibold font-['Inter'] leading-7">
                                        Professional Info
                                    </div>
                                    <div className="self-stretch text-muted-foreground text-sm font-normal font-['Inter'] leading-5 line-clamp-1">
                                        Update your photo and personal details here.
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="self-stretch flex flex-col justify-start items-start gap-6">
                                    {/* Years Of Experience */}
                                    <div className="w-full lg:w-[824px] inline-flex flex-col md:flex-row justify-start items-start md:items-center gap-4 md:gap-8 flex-wrap">
                                        <div className="w-full md:w-72 text-foreground text-sm font-medium font-['Inter'] leading-5">
                                            Years Of Experience
                                        </div>
                                        <div className="relative w-full md:w-[512px]">
                                            <Input
                                                className="w-full h-12 bg-muted/40 border-border/50 rounded-lg text-sm font-['Inter'] pr-10"
                                                placeholder="5"
                                            />
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>

                                    {/* Long term vision */}
                                    <div className="self-stretch inline-flex flex-col md:flex-row justify-start items-start gap-4 md:gap-8 flex-wrap">
                                        <div className="w-full md:w-72 flex flex-col gap-1">
                                            <div className="text-foreground text-sm font-medium font-['Inter'] leading-5">
                                                Long term vision
                                            </div>
                                            <div className="text-muted-foreground text-xs font-normal font-['Inter'] leading-5">
                                                Share your long term vision, like where you see your self in 3-5 years
                                            </div>
                                        </div>
                                        <div className="relative w-full md:w-[512px]">
                                            <Input
                                                className="w-full h-12 bg-muted/20 border-border/50 rounded-lg text-sm font-['Inter'] pr-10"
                                                placeholder="Type here..."
                                            />
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>

                                    {/* Main experience */}
                                    <div className="self-stretch inline-flex flex-col md:flex-row justify-start items-start gap-4 md:gap-8 flex-wrap">
                                        <div className="w-full md:w-72 text-foreground text-sm font-medium font-['Inter'] leading-5">
                                            Main experience
                                        </div>
                                        <div className="w-full md:w-[512px] p-2.5 bg-muted/40 rounded-lg border-2 border-primary/20 inline-flex flex-col justify-start items-start gap-2 group focus-within:border-primary transition-all">
                                            <div className="inline-flex flex-wrap justify-start items-center gap-2">
                                                <div className="px-2 py-0.5 bg-background rounded shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-1 outline-border/10 flex justify-center items-center gap-2">
                                                    <div className="text-foreground text-xs font-medium font-['Inter'] leading-5">App Development</div>
                                                </div>
                                                <div className="px-2 py-0.5 bg-background rounded shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-1 outline-border/10 flex justify-center items-center gap-2">
                                                    <div className="text-foreground text-xs font-medium font-['Inter'] leading-5">Marketing</div>
                                                </div>
                                                <div className="flex justify-start items-center gap-1">
                                                    <div className="text-foreground text-xs font-medium font-['Inter'] leading-5 pl-1 focus:outline-none min-w-[30px]" contentEditable onBlur={() => { }}>Dev</div>
                                                    <div className="w-[1.5px] h-4 bg-foreground rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="w-full flex justify-end">
                                                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Previous projects / startups? */}
                                    <div className="self-stretch inline-flex flex-col md:flex-row justify-start items-start gap-4 md:gap-8 flex-wrap">
                                        <div className="w-full md:w-72 text-foreground text-sm font-medium font-['Inter'] leading-5">
                                            Previous projects / startups?
                                        </div>
                                        <div className="rounded-lg shadow-[0px_2px_40px_0px_rgba(0,0,0,0.02)] outline outline-1 outline-border/20 flex justify-start items-start overflow-hidden w-fit">
                                            <button className="w-14 px-4 py-1.5 bg-primary text-white border-r border-border/10 text-sm font-semibold font-['Inter'] leading-5 transition-colors">
                                                Yes
                                            </button>
                                            <button className="w-14 px-4 py-1.5 bg-muted/40 text-muted-foreground text-sm font-normal font-['Inter'] leading-5 hover:bg-muted/60 transition-colors">
                                                No
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="self-stretch pt-4 border-t border-border/10 flex flex-row justify-end items-center gap-4">
                        <Button variant="ghost" className="h-12 px-6 rounded-xl text-muted-foreground hover:text-foreground font-bold font-['Inter'] uppercase tracking-widest text-[11px] flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button className="h-12 px-8 rounded-xl bg-primary text-white font-bold font-['Inter'] uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:translate-y-[-1px]">
                            Save Changes
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
