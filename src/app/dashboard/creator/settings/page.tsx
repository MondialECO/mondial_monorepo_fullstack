"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Lock, User, ChevronRight, Globe, Search, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("account");

    return (
        <div className="w-full max-w-[1136px] mx-auto pb-8 md:pb-12 px-4 md:px-0">
            <div className="bg-muted rounded-2xl shadow-[1px_2px_3px_0px_rgba(0,0,0,0.04)] shadow-[-2px_-1px_17px_0px_rgba(0,0,0,0.02)] outline outline-2 outline-offset-[-2px] outline-border overflow-hidden">
                <div className="px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
                    {/* Header Section */}
                    <div className="space-y-1">
                        <h1 className="text-foreground text-xl md:text-3xl font-medium font-['Inter Tight'] leading-tight md:leading-10">
                            Setting
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm font-normal font-['Inter'] leading-5">
                            Maintain command over your productivity system.
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="border-b border-border/10 pb-3 border-gray-200 overflow-x-auto no-scrollbar">
                        <div className="flex gap-4 md:gap-6 min-w-max">
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`text-xs md:text-sm font-['Inter'] leading-5 transition-colors relative whitespace-nowrap ${activeTab === "account"
                                    ? "text-blue-600 font-semibold"
                                    : "text-muted-foreground font-medium hover:text-foreground"
                                    }`}
                            >
                                Account setting
                            </button>
                            <button
                                onClick={() => setActiveTab("preferences")}
                                className={`text-xs md:text-sm font-['Inter'] leading-5 transition-colors relative whitespace-nowrap ${activeTab === "preferences"
                                    ? "text-blue-600 font-semibold"
                                    : "text-muted-foreground font-medium hover:text-foreground"
                                    }`}
                            >
                                Creator Preferences
                            </button>
                        </div>
                    </div>

                    {/* Shared Info Header */}
                    <div className="pb-4 md:pb-6 border-b border-border/10 border-gray-200">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-foreground text-base md:text-lg font-semibold font-['Inter'] leading-7">
                                Personal info
                            </h2>
                            <p className="text-muted-foreground text-xs md:text-sm font-normal font-['Inter'] leading-5 line-clamp-1">
                                Update your photo and personal details here.
                            </p>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex flex-col gap-4 md:gap-6">
                        {activeTab === "account" ? (
                            <>
                                {/* Full Name */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 pb-4 md:pb-6 border-b border-border/5 border-gray-200">
                                    <Label className="w-full md:w-72 text-foreground text-sm font-semibold font-['Inter'] leading-5">
                                        Full Name
                                    </Label>
                                    <Input
                                        className="flex-1 max-w-full md:max-w-[512px] h-10 md:h-11 bg-gray-200 border-border/20 text-muted-foreground cursor-not-allowed font-['Inter'] text-sm"
                                        placeholder="Mathen Jefer"
                                        disabled
                                    />
                                </div>

                                {/* Email Address */}
                                <div className="flex flex-col md:flex-row gap-2 md:gap-8 pb-4 md:pb-6 border-b border-border/5 border-gray-200">
                                    <div className="w-full md:w-72 flex flex-col gap-0.5 md:gap-1">
                                        <Label className="text-foreground text-sm font-semibold font-['Inter'] leading-5">
                                            Email Address
                                        </Label>
                                        <p className="text-muted-foreground text-[10px] md:text-xs font-normal font-['Inter'] leading-4 md:leading-5 w-full md:w-48">
                                            Primary email is fixed. Add a secondary for safety.
                                        </p>
                                    </div>
                                    <div className="w-full md:w-[512px] flex flex-col gap-3 md:gap-4">
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-10 h-10 md:h-11 bg-gray-200 border-border/20 text-muted-foreground cursor-not-allowed font-['Inter'] text-sm"
                                                placeholder="mathenjefr@gmail.com"
                                                disabled
                                            />
                                        </div>
                                        <Input
                                            className="h-10 md:h-11 bg-card border-border/50 focus:border-blue-500 transition-colors font-['Inter'] text-sm"
                                            placeholder="Secondary Email"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 pb-4 md:pb-6 border-b border-border/5 border-gray-200">
                                    <Label className="w-full md:w-72 text-foreground text-sm font-semibold font-['Inter'] leading-5">
                                        Phone
                                    </Label>
                                    <Input
                                        className="flex-1 max-w-full md:max-w-[512px] h-10 md:h-11 bg-card border-border/20 text-foreground font-['Inter'] text-sm"
                                        placeholder="phone number"
                                    />
                                </div>

                                {/* Password */}
                                <div className="flex flex-col md:flex-row gap-2 md:gap-8 pb-4 md:pb-0">
                                    <Label className="w-full md:w-72 text-foreground text-sm font-medium font-['Inter'] leading-5">
                                        Password
                                    </Label>
                                    <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 flex-wrap items-end">
                                        <Input
                                            type="password"
                                            className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] h-10 md:h-11 bg-card border-border/50 focus:border-blue-500 transition-colors font-['Inter'] text-sm"
                                            placeholder="Type Old password"
                                        />
                                        <Input
                                            type="password"
                                            className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] h-10 md:h-11 bg-card border-border/50 focus:border-blue-500 transition-colors font-['Inter'] text-sm"
                                            placeholder="Type Password here"
                                        />
                                        <Input
                                            type="password"
                                            className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] h-10 md:h-11 bg-card border-border/50 focus:border-blue-500 transition-colors font-['Inter'] text-sm"
                                            placeholder="Re type new password"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Preferred Role */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 pb-4 md:pb-6 border-b border-border/5 border-gray-200">
                                    <Label className="w-full md:w-72 text-foreground text-sm font-semibold font-['Inter'] leading-5">
                                        Preferred Role
                                    </Label>
                                    <Input
                                        className="flex-1 max-w-full md:max-w-[512px] h-10 md:h-11 bg-gray-200 border-border/20 text-muted-foreground cursor-not-allowed font-['Inter'] text-sm"
                                        placeholder="Advisor"
                                        disabled
                                    />
                                </div>

                                {/* Weekly Time Commitment */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 pb-4 md:pb-6 border-b border-border/5 border-gray-200">
                                    <Label className="w-full md:w-72 text-foreground text-sm font-semibold font-['Inter'] leading-5">
                                        Weekly Time Commitment
                                    </Label>
                                    <div className="flex-1 w-full md:max-w-[512px] relative">
                                        <Input
                                            className="h-10 md:h-11 w-full bg-card border-border/50 focus:border-blue-500 transition-colors font-['Inter'] pr-10 text-sm"
                                            placeholder="12-20 Hours"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>

                                {/* Geography focus */}
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 pb-4 md:pb-0">
                                    <Label className="w-full md:w-72 text-foreground text-sm font-medium font-['Inter'] leading-5">
                                        Geography focus
                                    </Label>
                                    <div className="flex-1 w-full md:max-w-[512px] relative">
                                        <Input
                                            className="h-10 md:h-11 w-full bg-card border-border/50 focus:border-blue-500 transition-colors font-['Inter'] pr-10 text-sm"
                                            placeholder="USA"
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="pt-4 flex justify-start">
                        <Button size="lg" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 shadow-sm font-['Inter'] text-sm font-semibold">
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
