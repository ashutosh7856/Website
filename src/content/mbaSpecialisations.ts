/**
 * What each MBA specialisation is about, in words. No salary figures: none of
 * them are in our official data, so none are stated. The colleges offering a
 * specialisation come from the snapshot (collegesOffering in mbaRoutes.mjs),
 * and a specialisation page is published only once enough verified colleges
 * list it.
 */
export interface SpecialisationContent {
  slug: string;
  /** 40–60 word answer under the H1. */
  answer: string;
  subjects: string[];
  roles: string[];
  suits: string;
  choosing: string;
  faqs: { q: string; a: string }[];
}

export const MBA_SPECIALISATION_CONTENT: SpecialisationContent[] = [
  {
    slug: "finance",
    answer:
      "An MBA in Finance teaches you how companies raise, invest and manage money: corporate finance, valuation, financial markets, banking and risk. It suits people comfortable with numbers who want roles in corporate finance, banking, investment research, treasury or consulting. Most two-year MBAs offer it as a second-year elective stream.",
    subjects: ["Corporate finance and valuation", "Financial markets and instruments", "Investment and portfolio management", "Financial modelling", "Banking and risk management", "Mergers and acquisitions"],
    roles: ["Corporate finance and FP&A", "Investment banking and equity research", "Commercial and retail banking", "Treasury and risk", "Financial consulting"],
    suits: "People who enjoy working with numbers and markets, and are prepared for technical interviews. A commerce, economics or engineering background helps but is not required.",
    choosing: "Look at the finance electives actually offered, whether the institute has a finance club or trading lab, and which finance recruiters appear in its placement report.",
    faqs: [
      { q: "Is an MBA in Finance good for non-commerce students?", a: "Yes. The first-year core teaches accounting and finance from the basics. Expect to put in extra effort early if you have not studied them before." },
      { q: "Do I need CFA or other certifications with an MBA in Finance?", a: "Not to graduate, but some roles in investment research value them. Decide after you know which finance role you want." },
    ],
  },
  {
    slug: "marketing",
    answer:
      "An MBA in Marketing teaches you how to understand customers and grow a product or brand: consumer behaviour, market research, brand management, sales, pricing and digital marketing. It suits people who enjoy understanding why people buy and turning that into decisions, and leads to roles in brand management, sales, product marketing and market research.",
    subjects: ["Consumer behaviour", "Marketing research", "Brand and product management", "Sales and distribution management", "Pricing", "Digital and performance marketing"],
    roles: ["Brand and product management", "Sales and channel management", "Market research and insights", "Digital marketing", "Marketing consulting"],
    suits: "People who are curious about customers, comfortable with both data and storytelling, and enjoy working across teams.",
    choosing: "Check the marketing electives, live projects with companies, and which FMCG, consumer-tech or services firms recruit from the campus.",
    faqs: [
      { q: "Is an MBA in Marketing only about advertising?", a: "No. Advertising is a small part. Most roles are in brand, product, sales and research, and increasingly involve data analysis." },
      { q: "Is sales experience useful before an MBA in Marketing?", a: "It can be. Sales experience gives you a practical view of customers and channels that recruiters value." },
    ],
  },
  {
    slug: "human-resource-management",
    answer:
      "An MBA in Human Resource Management prepares you to manage people in organisations: hiring, performance, pay and rewards, learning and development, employee relations and labour law. It suits people who enjoy working with people and systems, and leads to HR business partner, talent acquisition, compensation and organisation development roles. Some institutes run a dedicated HR programme.",
    subjects: ["Organisational behaviour", "Talent acquisition", "Performance and compensation management", "Learning and development", "Industrial relations and labour law", "HR analytics"],
    roles: ["HR business partner", "Talent acquisition", "Compensation and benefits", "Learning and development", "Organisation development"],
    suits: "People who like working with people, can handle sensitive situations, and are interested in how organisations work.",
    choosing: "Look for a dedicated HR programme or a deep HR elective set, industry projects, and HR recruiters in the placement report.",
    faqs: [
      { q: "Is HR a good MBA specialisation?", a: "It is a good fit if you want to shape how organisations hire, develop and keep people. HR roles are increasingly data-driven, so analytics skills help." },
      { q: "Are there institutes with a dedicated HR MBA?", a: "Yes. Some institutes run a separate HR programme alongside their general MBA; check each programme's own page and placement report." },
    ],
  },
  {
    slug: "business-analytics",
    answer:
      "An MBA in Business Analytics combines management with data: statistics, machine learning basics, data visualisation and using data to make business decisions. It suits people who like numbers and problem-solving and want analytics, consulting, product or strategy roles where decisions rest on data. It is offered as an elective stream or a separate programme.",
    subjects: ["Statistics and probability", "Data analysis with Python or R", "Machine learning for business", "Data visualisation", "Optimisation and decision models", "Marketing and operations analytics"],
    roles: ["Business and data analyst", "Analytics consulting", "Product analytics", "Strategy and operations analytics"],
    suits: "People with a quantitative bent who want to apply data to business problems, not only build models.",
    choosing: "Check whether analytics is a full programme or a few electives, the tools taught, and which analytics roles appear in the placement report.",
    faqs: [
      { q: "Do I need coding for an MBA in Business Analytics?", a: "Basic programming helps a lot. Most programmes teach Python or R from the start, but coming in with some practice makes the course easier." },
      { q: "Is business analytics better than finance or marketing?", a: "It is not better, it is different. Many students combine analytics with a functional area, which is often the strongest profile." },
    ],
  },
  {
    slug: "operations-management",
    answer:
      "An MBA in Operations Management teaches you how goods and services are produced and delivered efficiently: process design, quality, planning, project management and operations strategy. It suits people who enjoy making systems work better, often engineers, and leads to roles in operations, consulting, manufacturing, e-commerce and project management.",
    subjects: ["Operations strategy", "Process and quality management", "Production planning and control", "Project management", "Service operations", "Operations research"],
    roles: ["Operations and plant management", "Operations consulting", "Project and programme management", "E-commerce and fulfilment operations"],
    suits: "People who like solving practical, structured problems; engineers often find it a natural fit.",
    choosing: "Look at operations electives, live projects with manufacturers or logistics firms, and the operations recruiters in the placement report.",
    faqs: [
      { q: "Is operations a good MBA specialisation for engineers?", a: "Often, yes. It builds on problem-solving and process thinking, though engineers succeed in every specialisation." },
      { q: "What is the difference between operations and supply chain management?", a: "Operations focuses on running processes inside an organisation; supply chain looks at the flow of goods across suppliers, plants, warehouses and customers. Many programmes teach them together." },
    ],
  },
  {
    slug: "supply-chain-management",
    answer:
      "An MBA in Supply Chain Management covers how materials and products move from suppliers to customers: procurement, logistics, inventory, warehousing, demand planning and supply-chain analytics. It suits people who like coordinating complex systems, and leads to roles in procurement, logistics, planning and supply-chain consulting across manufacturing, retail and e-commerce.",
    subjects: ["Logistics and distribution", "Procurement and sourcing", "Inventory and demand planning", "Warehousing", "Supply-chain analytics", "Global supply chains"],
    roles: ["Supply-chain planning", "Procurement and sourcing", "Logistics management", "Supply-chain consulting"],
    suits: "People who enjoy coordinating many moving parts and solving problems with data.",
    choosing: "Check whether supply chain is a full stream or a few electives, and which manufacturing, retail and logistics firms recruit from the campus.",
    faqs: [
      { q: "Is supply chain management in demand?", a: "Supply-chain roles exist across manufacturing, retail and e-commerce. Check each institute's placement report for the recruiters who hire in this area." },
      { q: "Is supply chain management the same as logistics?", a: "Logistics — moving and storing goods — is one part of it. Supply-chain management also covers procurement, planning and how the whole network is designed." },
    ],
  },
  {
    slug: "international-business",
    answer:
      "An MBA in International Business focuses on trade and companies operating across borders: international marketing, trade policy, foreign exchange, export-import management and global strategy. It suits people interested in trade, multinational companies and cross-border roles. Some institutes specialise in it, while most offer it as an elective stream.",
    subjects: ["International trade and policy", "International marketing", "Foreign exchange and international finance", "Export-import management", "Global strategy", "Cross-cultural management"],
    roles: ["Export and trade management", "International marketing", "Global sourcing", "Roles with multinational companies"],
    suits: "People interested in trade, economics and working across countries and cultures.",
    choosing: "Look for trade-focused faculty, exchange programmes and recruiters with international operations.",
    faqs: [
      { q: "Does an MBA in International Business mean working abroad?", a: "Not necessarily. Many roles are India-based but deal with international markets, suppliers or customers." },
    ],
  },
  {
    slug: "information-technology",
    answer:
      "An MBA in IT and Systems Management sits between business and technology: information systems, IT strategy, digital transformation, product management and managing technology projects. It suits people, often with a technology background, who want to manage technology rather than only build it, in IT services, consulting and product companies.",
    subjects: ["Management information systems", "IT strategy and governance", "Digital transformation", "Product management", "IT project management", "Enterprise systems"],
    roles: ["IT consulting", "Product management", "Technology project and programme management", "Digital transformation roles"],
    suits: "People with a technology background who want to move towards strategy, product or management roles.",
    choosing: "Check the systems electives and the technology and consulting firms in the placement report.",
    faqs: [
      { q: "Is an MBA in IT useful after B.Tech?", a: "It can be, if you want to move from engineering into management, consulting or product roles. Compare it with general-management options at the same institutes." },
    ],
  },
  {
    slug: "entrepreneurship",
    answer:
      "An MBA in Entrepreneurship prepares you to start or grow a business: opportunity spotting, business models, venture finance, growth and managing a family business. It suits people who intend to build a company or take over a family enterprise. Look for institutes with incubators, founder networks and flexible placement options.",
    subjects: ["New venture creation", "Business model design", "Venture finance", "Family business management", "Growth and scaling", "Innovation management"],
    roles: ["Founding a start-up", "Running a family business", "Early-stage start-up roles", "Venture capital and incubation support"],
    suits: "People with a business idea or a family enterprise, comfortable with uncertainty.",
    choosing: "Check for an incubation centre, seed-funding support, mentorship and whether the institute lets students opt out of placements to build a venture.",
    faqs: [
      { q: "Do I need an MBA to start a business?", a: "No. An MBA can help with structure, network and fundamentals, but many founders build businesses without one." },
    ],
  },
  {
    slug: "agribusiness-management",
    answer:
      "An MBA in Agribusiness Management applies management to agriculture and food: agri-input and commodity markets, food processing, rural marketing, supply chains and agri-finance. It suits people interested in the food and agriculture economy. A few institutes run dedicated agribusiness programmes, such as IIM Lucknow's MBA in Agri-Business Management.",
    subjects: ["Agricultural economics", "Commodity markets", "Food processing and agri-supply chains", "Rural marketing", "Agri-finance", "Agricultural policy"],
    roles: ["Agri-input and food companies", "Commodity trading", "Rural banking and finance", "Agri-tech"],
    suits: "People with an interest in agriculture, food and rural markets, often from agriculture or related degrees.",
    choosing: "Look for a dedicated agribusiness programme and the agri-sector recruiters in its placement report.",
    faqs: [
      { q: "Who can do an MBA in Agribusiness?", a: "Each programme sets its own eligibility; some prefer or require an agriculture-related degree. Check the admission policy." },
    ],
  },
];

export const specialisationContent = (slug: string) => MBA_SPECIALISATION_CONTENT.find((s) => s.slug === slug);
