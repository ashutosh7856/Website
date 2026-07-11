import { GuideCard } from './GuideCard';

const DUMMY_IMAGE_URLS = {
    Shiv: './guide_shiv.webp',
    Soham: './guide_soham.webp',
    Aaditya: './guide_aaditya.webp',
    Prathmesh: './guide_prathmesh.webp',
}

const GUIDES = [
    {
        name: "Shiv",
        description: "Shiv Sir is a highly experienced Mathematics faculty known for his clear explanations, smart shortcuts, and exam-oriented teaching. He specialises in simplifying tough concepts and helping students improve their solving speed and accuracy for MHT CET.",
        image: DUMMY_IMAGE_URLS.Shiv,
        reverse: false,
    },
    {
        name: "Soham Bingewar",
        description: "Soham Sir is an expert Chemistry faculty known for his NCERT-focused teaching, quick revision techniques, and exam-oriented approach. He simplifies Organic, Inorganic, and Physical Chemistry through smart tricks, memory cues, and high-weightage focus.",
        image: DUMMY_IMAGE_URLS.Soham,
        reverse: true,
    },
    {
        name: "Aaditya Dahale",
        description: "Strategy Planner & Mentor, who has guided and mentored more than 75,000 MHT CET aspirants with clear planning, smart strategies, and result-oriented direction.",
        image: DUMMY_IMAGE_URLS.Aaditya,
        reverse: false,
    },
    {
        name: "Prathmesh Hatwar",
        description: "Prathmesh Sir makes Physics feel simple, logical, and fully exam-oriented. He focuses on conceptual understanding, derivation shortcuts, and high-weightage chapter coverage. His one-shot lectures and problem-solving sessions help students master theory + numericals in minimum time.",
        image: DUMMY_IMAGE_URLS.Prathmesh,
        reverse: true,
    },
];


export function GuidanceSection() {
    return (
        <section className="bg-[#F5F5F7] py-1 lg:py-1" style={{ marginTop: '1px' }}>
            
            <h2
                className="text-center mx-auto mb-8 lg:mb-16 text-2xl lg:text-[40px]"
                style={{
                    maxWidth: '613px',
                    fontFamily: 'Poppins',
                    fontWeight: 600,
                    lineHeight: '100%',
                    color: '#13097D',
                }}
            >
                You will be guided by
            </h2>

            <div className="flex flex-col items-center space-y-4 lg:space-y-8"
                 style={{ 
                    maxWidth: '1202px',
                    margin: '0 auto',
                 }}
            >
                {GUIDES.map((guide, index) => (
                    <div
                        key={index}
                        className={`
                            w-full max-w-[1037px] px-4 lg:px-0 
                            ${guide.reverse ? "lg:translate-x-16" : "lg:-translate-x-16"}
                        `}
                    >
                         <GuideCard guide={guide} />
                    </div>
                ))}
            </div>
        </section>
    );
}