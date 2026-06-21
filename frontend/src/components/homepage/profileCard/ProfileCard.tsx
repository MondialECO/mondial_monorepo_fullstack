"use client";

import Image from "next/image";
import React from "react";

interface ProfileCardProps {
    name: string;
    role: string;
    email: string;
    avatar: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    name,
    role,
    email,
    avatar,
}) => {
    return (
        <div className="w-full max-w-sm bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-lg">
            {/* Top Section */}
            <div className="flex items-center gap-4">
                <div className="relative w-14 h-14">
                    <Image
                        src={avatar}
                        alt={name}
                        fill
                        className="rounded-full object-cover"
                    />
                </div>

                <div>
                    <h3 className="text-white text-lg font-semibold leading-tight">
                        {name}
                    </h3>
                    <p className="text-gray-400 text-sm">{role}</p>
                </div>
            </div>

            {/* Divider */}
            <div className="my-5 h-px bg-[#1F2937]" />

            {/* Info */}
            <div className="space-y-3">
                <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-white">{email}</p>
                </div>

                <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        <p className="text-sm text-green-400">Active</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
                <button className="flex-1 bg-white text-black text-sm font-medium py-2 rounded-lg hover:opacity-90 transition">
                    View Profile
                </button>
                <button className="flex-1 bg-[#1F2937] text-white text-sm py-2 rounded-lg hover:bg-[#374151] transition">
                    Message
                </button>
            </div>
        </div>
    );
};

export default ProfileCard;