import Image from "next/image";

const profiles = [
    {
        name: "Creator",
        image: "/profiles/creator.png",
        color: "text-[#AA2093]",
        bg: "bg-[#EED0E9]",
    },
    {
        name: "Investor",
        image: "/profiles/investor.png",
        color: "text-[#186B66]",
        bg: "bg-[#91E7E1]",
    },
    {
        name: "Entrepreneur",
        image: "/profiles/entrepreneur.png",
        color: "text-[#5E6424]",
        bg: "bg-[#D7DD9D]",
    },
    {
        name: "Service Provider",
        image: "/profiles/service.png",
        color: "text-[#1E6688]",
        bg: "bg-[#C4DCE7]",
    },
];

export default function AllProfileSection() {
    return (
        <section className="relative w-full bg-[#FAFAFA] flex justify-center pt-10 md:pt-16">

            {/* top fade to connect hero */}
            <div className="absolute top-0 left-0 w-full h-16 md:h-30 bg-linear-to-b from-transparent to-[#FAFAFA] pointer-events-none" />
            <div className="w-full max-w-7xl px-4 md:px-6 py-16 md:py-24 flex flex-col items-center">

                {/* 🔥 Heading */}
                <div className="flex flex-col items-center text-center max-w-2xl mb-12 md:mb-16 gap-3">
                    <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-[#070707]">
                        4{" "}
                        <span className="italic font-semibold">
                            Unique Profiles
                        </span>
                        , <br className="hidden md:block" />
                        1 Epic{" "}
                        <span className="italic font-semibold">
                            Solution!
                        </span>
                    </h2>

                    <p className="text-sm md:text-base text-[#3E3E3E] max-w-xl">
                        Whether you&#39;re a founder, entrepreneur, investor, or service
                        provider, our platform is here to support your journey.
                    </p>
                </div>

                {/* 💎 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">

                    {profiles.map((profile, i) => (
                        <div
                            key={i}
                            className="group relative bg-[#F9F9FA] border border-white rounded-2xl p-4 flex flex-col justify-between
              shadow-[0_2px_8px_rgba(0,0,0,0.04)]
              hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
              transition-all duration-500 hover:-translate-y-2"
                        >

                            {/* 🧠 Content */}
                            <div className="flex flex-col gap-6">

                                {/* 🎯 Header */}
                                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white shadow-sm bg-[#F9F9FA]">

                                    {/* Avatar */}
                                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${profile.bg}`}>
                                        <Image
                                            src={profile.image}
                                            alt={profile.name}
                                            width={64}
                                            height={64}
                                            className="object-contain"
                                        />
                                    </div>

                                    {/* Title */}
                                    <h3 className={`mt-4 text-xl font-medium ${profile.color}`}>
                                        {profile.name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-[#3E3E3E] text-center mt-1">
                                        Tailored tools and insights for your role in the ecosystem.
                                    </p>
                                </div>

                                {/* ⚡ Features */}
                                <div className="flex flex-col gap-3 px-2">
                                    {[
                                        "Smart project insights",
                                        "Seamless collaboration",
                                        "Network growth tools",
                                        "Scalable opportunities",
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-[#070707]">
                                            <div className="w-4 h-4 rounded-full bg-black/80" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 🚀 CTA */}
                            <button className="mt-6 w-full py-3 rounded-full border border-black/10 bg-white text-sm font-medium
                shadow-sm hover:bg-black hover:text-white transition-all duration-300">
                                Explore →
                            </button>

                            {/* ✨ Hover Glow */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none">
                                <div className="absolute -inset-1 bg-linear-to-r from-transparent via-white/40 to-transparent blur-xl" />
                            </div>

                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
}