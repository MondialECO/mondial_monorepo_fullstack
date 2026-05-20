import Image from "next/image";

const roles = [
    { name: "Creator", image: "/profiles/creator.png" },
    { name: "Investor", image: "/profiles/investor.png" },
    { name: "Entrepreneur", image: "/profiles/entrepreneur.png" },
    { name: "Service Provider", image: "/profiles/service.png" },
];

export default function RolesSection() {
    return (
        <section className="w-full bg-[#FAFAFA] flex justify-center py-20 md:py-28">

            <div className="w-full max-w-[1108px] px-4 flex flex-col items-center">

                {/* 🔥 Heading */}
                <div className="flex flex-col items-center text-center gap-3 mb-16 max-w-[540px]">

                    <h2 className="text-[32px] md:text-[52px] leading-[1.15] tracking-tight font-medium text-[#070707]">
                        4{" "}
                        <span className="italic font-semibold">
                            Unique Profiles
                        </span>
                        , 1 Epic{" "}
                        <span className="italic font-semibold">
                            Solution!
                        </span>
                    </h2>

                    <p className="text-[14px] md:text-[16px] text-[#3E3E3E] max-w-[480px]">
                        Whether you&apos;re a founder, entrepreneur, investor, or service
                        provider, our platform is here to support your journey.
                    </p>
                </div>

                {/* 💎 Roles */}
                <div className="w-full flex flex-wrap justify-center md:justify-between items-center gap-y-10 md:gap-y-0 gap-x-6 md:gap-x-12 lg:gap-x-[80px]">

                    {roles.map((role, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center gap-1 group"
                        >

                            {/* 🧠 Avatar */}
                            <div className="relative w-[120px] h-[120px] md:w-[186px] md:h-[186px] transition-transform duration-500 group-hover:scale-105">
                                <Image
                                    src={role.image}
                                    alt={role.name}
                                    fill
                                    sizes="(max-width: 768px) 120px, 186px"
                                    className="object-contain"
                                />
                            </div>

                            {/* 🏷️ Label */}
                            <div className="mt-2 px-4 md:px-5 py-1.5 rounded-full bg-[#F9F9FA] border border-white text-[#070707] text-[13px] md:text-[14px] font-medium shadow-sm">
                                {role.name}
                            </div>

                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
}