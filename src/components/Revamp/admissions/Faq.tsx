import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Faq() {
    const faqData = [
        {
            question: "What does an education consultant in India do?",
            answer: "An education consultant in India is like your personal navigator for school and job choices, zeroing in on what you love, what you're good at, and where you wanna end up. Over at ProCounsel, we hook you up with career counselling services, solid career guidance for students, and hands-on university admission support whether you're staying in India or heading overseas.",
            keywords: ["education consultant in india", "career counselling services", "career guidance for students", "university admission support"]
        },
        {
            question: "How do career counselling services help students?",
            answer: "Career counselling services are a lifesaver—they help kids figure out their real strengths, what fires them up, and careers that actually match. You do some structured assessments, chat with a certified career coach, and boom: no more head-scratching, just clear steps to nail your education and career picks with total confidence.",
            keywords: ["career counselling services", "career counselling online"]
        },
        {
            question: "What are the benefits of career counselling?",
            answer: "The benefits of career counselling? You get crystal-clear thinking, a confidence boost, and a solid plan for the long game. Lean on experienced career coaching services, and you'll dodge those career mistakes that cost you big, save tons of time and cash, plus snag personalized career guidance for students that's spot-on for your dreams.",
            keywords: ["career coaching services", "career guidance for students"]
        },
        {
            question: "Is career counselling worth it in India?",
            answer: "Oh yeah, career counselling is worth it in India hands down—think cutthroat competition and a million paths to pick from. With top career coaches and dependable career counselling services in your corner, you and other pros make choices that stick and charge into your future feeling unstoppable.",
            keywords: ["career counselling services", "best career coaching services"]
        },
        {
            question: "What is the scope of career counselling?",
            answer: "The scope of career counselling is exploding everywhere in India these days. Career coaching services tackle subject selection, skill assessment, plotting higher education, smooth career transitions, and even career counselling online, so top guidance hits students no matter where they are.",
            keywords: ["career coaching services", "career counselling online"]
        },
        {
            question: "How does career counselling online work?",
            answer: "Career counselling online? It's all about jumping on virtual calls for pro advice without leaving home. ProCounsel's setup includes quick assessments, real-talk one-on-ones, and custom tips from a certified career coach—quality stuff you can grab from any corner of India.",
            keywords: ["career counselling online", "career counselling services"]
        },
        {
            question: "Who should take career guidance for students?",
            answer: "Anyone grabbing career guidance for students will love it post-10th, after 12th, once you're done with grad school, or if you're a pro in the workforce. Feeling stuck on your next move, college plans, or skills? Dive into professional career counselling services and sort it out.",
            keywords: ["career guidance for students", "career counselling services"]
        },
        {
            question: "How do study abroad consultants in India support students?",
            answer: "Study abroad consultants in India got your back on choosing countries, scouting unis, apps, and visas. As one of the best study abroad consultants in India, ProCounsel makes the whole international education journey a breeze with full support from start to finish.",
            keywords: ["study abroad consultant india", "best study abroad consultants in india"]
        },
        {
            question: "What makes ProCounsel a trusted career consultant?",
            answer: "What sets ProCounsel apart as a trusted career consultant? It's our custom-fit advice, straight-up ethical counselling, and pro-level planning. Certified career coaches and battle-tested education consultants in India dish out real-world pointers, solid assessments, and total backup for your school and job decisions.",
            keywords: ["education consultant in india", "best career coaching services"]
        },
        {
            question: "How do I choose the best career coaching services?",
            answer: "To snag the best career coaching services, hunt for certified pros, open-and-honest processes, and advice tailored just for you. The top career coaches who really get student goals and what's hot in industries? They're the ones who deliver career support that actually moves the needle.",
            keywords: ["best career coaching services", "career coaching services"]
        },
        {
            question: "Are career coaching services useful for working professionals?",
            answer: "For sure, career coaching services rock for working professionals chasing growth, a career switch, or fresh skills. Top career coaches link up your know-how with killer future gigs.",
            keywords: ["career coaching services", "best career coaching services"]
        },
    ]

    const [open, setOpen] = useState<number | null>(null)

    const toggleFaq = (index: number) => {
        setOpen(open === index ? null : index)
    }

    return (
        <div className="w-full bg-[#C6DDF040]">
            <div className="max-w-7xl px-4  mx-auto py-6 md:py-10 flex flex-col gap-6 md:gap-8">
                
                {/* Mobile Heading Layout (Matches other sections) */}
                <div className="md:hidden flex items-center justify-start gap-[8px] bg-white px-[12px] py-[4px] rounded-[4px] w-fit shrink-0">
                    <div className="w-[16px] h-[16px] min-w-[16px] min-h-[16px] bg-[#0E1629] shrink-0" />
                    <p className="font-[Poppins] font-semibold text-[12px] text-[#0E1629] uppercase tracking-[0.07em] leading-none whitespace-nowrap">
                        FAQ
                    </p>
                </div>

                {/* Desktop Heading (Original) */}
                <img loading="lazy" decoding="async" src="/faq.svg" alt="faq_image" className="hidden md:block h-[29px] w-[88px]" />

                <div className="flex flex-col gap-3 md:gap-4">
                    {faqData.map((item, index) => (
                        <div 
                            key={index} 
                            className="w-full max-w-[1320px] bg-white rounded-lg overflow-hidden transition-all duration-300"
                        >
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between py-3 px-4 md:py-[18px] md:px-[24px] text-left cursor-pointer transition-colors duration-200 hover:bg-white group"
                            >
                                <span 
                                    className="font-[Poppins] font-medium text-[14px] md:text-[18px] leading-[1.3] md:leading-[100%] text-(--text-main)"
                                    style={{ verticalAlign: "middle" }}
                                >
                                    {item.question}
                                </span>
                                <ChevronDown 
                                    className={`flex-shrink-0 transition-transform duration-200 text-(--text-main) w-5 h-5 md:w-6 md:h-6 ${
                                        open === index ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            <div 
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                    open === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                }`}
                            >
                                <div className="px-4 pb-3 md:px-[24px] md:pb-[18px]">
                                    <p className="font-[Poppins] font-normal text-[12px] md:text-[18px] leading-[1.4] md:leading-[100%] text-[#6B7280] md:text-(--text-muted) mt-2 md:mt-[18px]">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}