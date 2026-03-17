import Image from "next/image";

/* ================= DATA ================= */

const testimonials = [
    {
        name: "John Carter",
        role: "Founder",
        company: "Megentan",
        text: "This platform completely transformed how I approach my workflow. Highly recommended!",
        image: "/images/t1.png",
    },
    {
        name: "Sarah Lee",
        role: "Investor",
        company: "Megentan",
        text: "Smart, efficient, and intuitive. It saves me hours every week.",
        image: "/images/t2.png",
    },
    {
        name: "David Kim",
        role: "Entrepreneur",
        company: "Megentan",
        text: "A game changer for anyone serious about scaling ideas.",
        image: "/images/t3.png",
    },
];

const statsRow1 = [
    { value: "120K+", label: "Active Users", bg: "bg-[#F5F9B8]", rounded: "rounded-[24px_92px_24px_24px]" },
    { value: "$45M", label: "Revenue Generated", bg: "bg-[#B4F4D3]", rounded: "rounded-[24px]" },
];

const statsRow2 = [
    { value: "98%", label: "Success Rate", bg: "bg-[#EAE3FD]", rounded: "rounded-[24px_92px_24px_24px]" },
    { value: "24/7", label: "Support", bg: "bg-[#CBEBFB]", rounded: "rounded-[92px_24px_24px_24px]" },
];

const statsRow3 = [
    { value: "10K+", label: "Projects Built", bg: "bg-[#FCDEDF]", rounded: "rounded-[24px]" },
    { value: "80%", label: "Conversion Rate", bg: "bg-[#E3FBD0]", rounded: "rounded-[92px_24px_24px_24px]" },
];

/* ================= COMPONENT ================= */

export default function ImpactSection() {
    return (
        <section className="relative w-full bg-[#F9F9FA] py-[120px] overflow-hidden">

            {/* Blur BG */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[1200px] bg-purple-200 opacity-20 blur-[80px] pointer-events-none" />

            <div className="max-w-[1161px] mx-auto px-4 flex flex-col items-center gap-[80px]">

                {/* Heading */}
                <div className="max-w-[562px] text-center flex flex-col gap-3">
                    <h2 className="text-[36px] md:text-[52px] leading-[44px] md:leading-[60px] italic text-[#070707] font-serif">
                        Real Impact, Real Results
                    </h2>

                    <p className="text-[16px] leading-[24px] text-[#3E3E3E]">
                        Discover how our platform is transforming ideas into measurable success.
                    </p>
                </div>

                {/* CONTENT */}
                <div className="w-full flex flex-col gap-6">

                    {/* ROW 1 */}
                    <Row
                        testimonial={testimonials[0]}
                        stats={statsRow1}
                    />

                    {/* ROW 2 */}
                    <Row
                        testimonial={testimonials[1]}
                        stats={statsRow2}
                        reverse
                    />

                    {/* ROW 3 */}
                    <Row
                        testimonial={testimonials[2]}
                        stats={statsRow3}
                    />

                </div>
            </div>
        </section>
    );
}

/* ================= ROW ================= */

function Row({
    testimonial,
    stats,
    reverse = false,
}: any) {
    return (
        <div className={`flex flex-col lg:flex-row gap-5 ${reverse ? "lg:flex-row-reverse" : ""}`}>

            <TestimonialCard data={testimonial} />

            <div className="flex gap-5 w-full lg:w-[489px]">
                {stats.map((stat: any, i: number) => (
                    <StatCard key={i} stat={stat} />
                ))}
            </div>
        </div>
    );
}

/* ================= TESTIMONIAL ================= */

function TestimonialCard({ data }: any) {
    return (
        <div className="flex w-full lg:w-[652px] bg-[#F9F9FA] border-2 border-white rounded-[28px] shadow-[ -2px_-1px_17px_rgba(0,0,0,0.02),1px_2px_3px_rgba(0,0,0,0.04)] p-5 gap-6">

            {/* Image */}
            <div className="w-[120px] h-[140px] md:w-[212px] md:h-[240px] relative rounded-[20px] overflow-hidden">
                <Image src={data.image} alt={data.name} fill className="object-cover" />
            </div>

            {/* Text */}
            <div className="flex flex-col justify-between flex-1">

                <p className="text-[16px] md:text-[20px] leading-[24px] md:leading-[28px] text-[#5E5E5E] font-medium">
                    {data.text}
                </p>

                <div className="flex justify-between items-center mt-4">

                    <div>
                        <p className="text-[16px] md:text-[18px] font-medium text-[#272626]">
                            {data.name}
                        </p>
                        <p className="text-[14px] md:text-[16px] text-[#5E5E5E]">
                            {data.role}
                        </p>
                    </div>

                    <span className="text-[20px] md:text-[32px] font-semibold text-[#070707]">
                        {data.company}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ================= STAT ================= */

function StatCard({ stat }: any) {
    return (
        <div
            className={`flex flex-col justify-between p-6 w-full h-[240px] md:h-[280px] border-2 border-white shadow-[ -2px_-1px_17px_rgba(0,0,0,0.02),1px_2px_3px_rgba(0,0,0,0.04)] ${stat.bg} ${stat.rounded}`}
        >
            <div>
                <p className="text-[24px] md:text-[32px] font-semibold text-[#272626]">
                    {stat.value}
                </p>
                <p className="text-[14px] md:text-[16px] text-[#070707]">
                    {stat.label}
                </p>
            </div>

            <span className="text-[20px] md:text-[32px] font-semibold text-black">
                Megentan
            </span>
        </div>
    );
}