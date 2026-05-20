import { Profile } from "@/types/creator/publicProfile"

export const getProfileData = (id: string): Profile => ({
    id,
    name: "Mathen Jefer",
    role: "Founder",
    location: "California, USA",
    verified: true,
    mondialScore: "90%",
    experience: "5 years 🚀✨",
    bio: "Challenges are tough, but each problem offers growth. Embrace struggles and let them fuel your determination!",
    vision: "Facing challenges can be tough, but remember that every problem is an opportunity for growth. Embrace the struggle, learn from it, and let it fuel your determination to succeed. Keep pushing forward, and you'll find the strength within you to overcome any obstacle!",
    tags: ["Finance", "SaaS", "E-commerce", "AI / Data"],
    prevProjects: [
        "Make a coffeehouse without large amount of cup",
        "Man in town without hat"
    ],
    projects: [
        {
            id: 1,
            title: "Launch a Mobile Pet Grooming Service",
            date: "22 January 2027",
            pitch: "A convenient, on-demand pet grooming service delivered right to your doorstep, ensuring a stress-free experience for pets and owners alike.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=1", "https://i.pravatar.cc/32?u=2"]
        },
        {
            id: 2,
            title: "Develop an AI-Powered Language Tutor",
            date: "15 February 2027",
            pitch: "An innovative language learning app that uses AI to provide personalized coaching, real-time feedback, and immersive conversation practice.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1546410531-bb4caa1b42fa?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=3", "https://i.pravatar.cc/32?u=4"]
        },
        {
            id: 3,
            title: "Eco-Friendly Packaging Solutions",
            date: "01 March 2027",
            pitch: "Sustainable, biodegradable packaging materials for e-commerce businesses to reduce their environmental footprint while maintaining product safety.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=5", "https://i.pravatar.cc/32?u=6"]
        },
        {
            id: 4,
            title: "Smart City Energy Grid",
            date: "12 April 2027",
            pitch: "A blockchain-enabled smart grid system that optimizes energy distribution and allows peer-to-peer renewable energy trading within urban areas.",
            funded: "$0.00",
            goal: "$10,000",
            equity: "30%",
            type: "MVP",
            mondial: "70%",
            image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=60",
            team: ["https://i.pravatar.cc/32?u=7", "https://i.pravatar.cc/32?u=8"]
        }
    ]
})
