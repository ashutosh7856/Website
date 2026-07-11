import PageSEO from "@/components/SEO/PageSEO";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO title="Terms & Conditions | ProCounsel" description="Read ProCounsel's terms and conditions covering use of our career counselling, admissions guidance, and platform services." canonical="/terms" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-22 pb-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 lg:p-12">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-gray-600">
              Last Updated: 20th August, 2025
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ProCounsel - A product of CATALYSTAI TECHNOLOGY PRIVATE LIMITED
            </p>
          </div>

          <div className="prose max-w-none">
            
            <section className="mb-10">
              <p className="text-lg text-gray-700 mb-6">
                Welcome to <strong>ProCounsel</strong>! These Terms & Conditions (“Terms”) govern your use of our platform, mobile application, and services (collectively referred to as the “App”). This document covers the terms for both <strong>Students</strong> and <strong>Counsellors</strong>.
              </p>
              <p className="text-gray-700">
                By creating an account, booking an appointment, purchasing ProCoins, registering as a counsellor, or otherwise using our services, you acknowledge that you have read, understood, and agreed to these Terms & Conditions and our Privacy Policy. If you do not agree, you must stop using the App immediately.
              </p>
            </section>

            <section className="mb-12">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
                <h2 className="text-3xl font-bold text-blue-800 mb-2">TERMS FOR STUDENTS</h2>
                <p className="text-blue-700">The following terms apply to students using ProCounsel services</p>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h3>
              <p className="text-gray-700 mb-4">
                By creating an account or using ProCounsel, you acknowledge that you have read, understood, and agreed to these Terms & Conditions and our Privacy Policy. If you do not agree, please refrain from using the App.
              </p>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">2. Eligibility</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>You must be at least 18 years of age to use the App.</li>
                <li>If you are under 18, you may use the App only under the supervision of a parent or legal guardian, who hereby agrees to these Terms on your behalf.</li>
                <li>You agree to provide true, complete, and accurate information and maintain the confidentiality of your account credentials.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Services We Provide</h3>
              <p className="text-gray-700 mb-4">
                ProCounsel acts as a trusted bridge between students and verified education counsellors. As a student, you can:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Explore colleges, courses, and exams available across India.</li>
                <li>View counsellor profiles, including their experience, availability, and location.</li>
                <li>Book appointments or subscribe to counsellors for admission guidance.</li>
                <li>Communicate with counsellors via chat or scheduled sessions.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">4. User Account & Security</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your login credentials and restricting access to your device.</li>
                <li>You agree to notify ProCounsel immediately of any unauthorized access or security breach.</li>
                <li>ProCounsel shall not be liable for losses arising from your failure to protect your account credentials.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">5. ProCoins & Payments</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>ProCoins are the in-app virtual currency used within ProCounsel (₹1 = 1 ProCoin).</li>
                <li>You can purchase ProCoins securely via our trusted payment gateway (Razorpay).</li>
                <li>Purchased ProCoins will be credited to your in-app wallet and may be used to pay for counsellor subscriptions.</li>
                <li>ProCounsel does not store sensitive payment data such as card or UPI details. All transactions are securely handled by Razorpay.</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-bold text-gray-800">Refund Policy</p>
                <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-2">
                  <li>ProCoins once purchased are non-refundable and non-transferable.</li>
                  <li>In case of technical issues, failed transactions, or double deductions, refunds (if applicable) will be processed within 7 working days after verification.</li>
                  <li>Refunds, if any, shall be processed in accordance with the RBI Payment Gateway Guidelines and subject to Razorpay’s refund mechanisms.</li>
                </ul>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">6. Student Responsibilities</h3>
              <p className="text-gray-700 mb-4">By using our App, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Use the App only for lawful and non-commercial purposes related to education and counselling.</li>
                <li>Provide accurate information while booking or subscribing.</li>
                <li>Maintain respect and professionalism while interacting with counsellors.</li>
                <li>Refrain from attempting direct payments or communication with counsellors outside the platform.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">7. Counsellor Interaction</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Counsellors on ProCounsel are independent professionals and not employees of the Company.</li>
                <li>ProCounsel only facilitates the connection and does not endorse or guarantee the qualifications or advice of any counsellor.</li>
                <li>Students are strongly encouraged to use their discretion before acting upon any guidance received.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">7A. Prohibited Activities</h3>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Upload, transmit, or share any unlawful, defamatory, obscene, or infringing content.</li>
                <li>Impersonate another individual or misrepresent your identity.</li>
                <li>Attempt to gain unauthorized access to the App, servers, or other user data.</li>
                <li>Circumvent payment mechanisms or attempt off-platform transactions.</li>
                <li>Engage in activities that disrupt or harm the platform’s functionality or reputation.</li>
              </ul>

              
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">8. Cancellations</h3>
              <p className="text-gray-700 mb-6">
                Subscription cancellations are subject to individual counsellor policies. Once ProCoins are spent, they cannot be reversed or refunded. In case of technical errors or payment disputes, please contact hr@procounsel.co.in for assistance.
              </p>
            </section>

            <section className="mb-12">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6">
                <h2 className="text-3xl font-bold text-purple-800 mb-2">TERMS FOR COUNSELLORS</h2>
                <p className="text-purple-700">The following terms apply to counsellors providing services on ProCounsel</p>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Purpose of ProCounsel</h3>
              <p className="text-gray-700 mb-6">
                ProCounsel is an online platform that connects students with verified education counsellors for academic guidance, career counselling, and admission-related consultations. Counsellors provide services based on student subscriptions (Plus, Pro, Elite) ensuring quality, professionalism, and compliance with these Terms.
              </p>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">2. Account Verification & Activation</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Your account will be activated only after verification and approval by the ProCounsel team.</li>
                <li>Counselling charges, revenue share, and applicable commission will be finalized during or after verification.</li>
                <li>You may not provide services or earn rewards until your account is officially activated.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Earnings, Payment & Withdrawal</h3>
              <p className="text-gray-700 mb-4">Counsellors shall earn platform credits termed as “ProCoins” in exchange for services on the ProCounsel platform. The value of 1 ProCoin shall be determined during the onboarding process, based on the applicable payout rate and plan type. The payout rate and commission vary depending on the subscription plan (Plus, Pro, or Elite) and the current cycle earnings slab of the counsellor.</p>
              <p className="text-gray-700 mb-4">The current slabs for determining payout rates and commissions are as follows:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>₹0 – 5 Lakhs</li>
                  <li>₹5 – 10 Lakhs</li>
                  <li>₹10 – 20 Lakhs</li>
                  <li>₹20 Lakhs and above</li>
              </ul>
              <p className="text-gray-700 mb-4">Payments shall be disbursed twice a month, calculated on the basis of the Counsellor’s accumulated ProCoins converted into their corresponding INR value in accordance with the prevailing payout structure. All payments will be credited to the counsellor’s verified bank account within 5–7 business days after the scheduled disbursement date (1st or 16th), subject to successful verification</p>
              <p className="text-gray-700 mb-6">All payouts are subject to applicable tax deductions (TDS, GST) and ProCounsel’s commission structure, as per prevailing laws and the counsellor’s plan and slab category.</p>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">3A. TDS Certification</h3>
              <p className="text-gray-700 mb-6">
                ProCounsel shall issue TDS certificates (Form 16A) to counsellors for every financial year in which tax has been deducted on payouts, in accordance with the provisions of the Income Tax Act, 1961.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">4. Independent Contractor Relationship</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>You act solely as an independent contractor, not as an employee, partner, or agent of ProCounsel.</li>
                <li>You are free to offer services elsewhere, provided you do not solicit or promote competing services to ProCounsel students outside the platform.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">5. Tax Responsibility</h3>
              <p className="text-gray-700 mb-6">
                You are solely responsible for all taxes (including TDS, GST, or income tax) arising from earnings received through the platform. You agree to comply with applicable Indian tax laws, including filing returns and paying liabilities.
              </p>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">6. Counsellor Code of Conduct</h3>
              <p className="text-gray-700 mb-4">You agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                  <li>Maintain professionalism, honesty, and integrity in all interactions.</li>
                  <li>Respect student confidentiality and privacy.</li>
                  <li>Avoid making false claims, guarantees of admissions, or unrealistic promises.</li>
                  <li>Not engage in offensive, discriminatory, or unprofessional conduct.</li>
                  <li>Not solicit direct contact or off-platform payments from students.</li>
                  <li>Comply with applicable laws and ProCounsel’s policies.</li>
              </ul>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">7. Intellectual Property & Confidentiality</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>All proprietary technology, branding, and content provided by ProCounsel remain the Company’s property.</li>
                <li>Any counselling material you create remains your property, but ProCounsel may use it for quality audits, dispute resolution, or training.</li>
                <li>You must maintain strict confidentiality regarding all student information, communication, and company-related data.</li>
                <li>You shall not copy, share, or store student data outside the ProCounsel platform.</li>
                <li>You also agree to comply with applicable privacy regulations, including the Digital Personal Data Protection Act, 2023 (India), when handling student or company data.</li>
              </ul>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">8. Liability & Indemnity</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>You warrant that you have the necessary qualifications and expertise to provide counselling services.</li>
                <li>The Company is not liable for any consequences of your guidance.</li>
                <li>You agree to indemnify and hold the Company harmless from any claims, damages, or liabilities arising from your services.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">9. Non-Solicitation</h3>
              <p className="text-gray-700 mb-6">
                You may not directly or indirectly solicit, contact, or provide services to ProCounsel students outside the platform for one (1) year after termination.
              </p>
            </section>

            <section className="mb-12">
              <div className="bg-gray-50 border-l-4 border-gray-500 p-6 mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">GENERAL TERMS</h2>
                <p className="text-gray-700">The following terms apply to all users of ProCounsel</p>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Privacy</h3>
              <p className="text-gray-700 mb-6">
                We collect and use your personal information in accordance with our Privacy Policy. By using the App, you consent to such collection and processing.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">2. Intellectual Property</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>All logos, trademarks, software, and content available on the ProCounsel platform are owned by or licensed to CatalystAI Technology Private Limited.</li>
                <li>You may not copy, modify, or distribute any part of the App or its materials without written consent from the Company.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Limitations of Liability</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>ProCounsel provides the platform “as is” without warranties of any kind.</li>
                <li>We do not guarantee the success or outcome of counselling sessions.</li>
                <li>To the maximum extent permitted by law, ProCounsel shall not be liable for indirect, incidental, or consequential damages resulting from App use or counsellor advice.</li>
              </ul>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">4. Termination</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>ProCounsel may suspend or terminate your account if you misuse the App, violate these Terms, or engage in fraudulent activities. For counsellors, termination may also occur for unethical conduct or poor performance.</li>
                <li>For students, upon termination, all unused ProCoins will be forfeited without refund.</li>
                <li>For counsellors, either party may terminate with 7 days’ written notice. Any outstanding ProCoins will be settled as per the standard withdrawal policy.</li>
              </ul>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">5. Amendments to Terms</h3>
              <p className="text-gray-700 mb-6">
                ProCounsel may update or amend these Terms with prior notice. Continued use of the platform after such notice implies acceptance of the revised Terms.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">5A. Force Majeure</h3>
              <p className="text-gray-700 mb-6">
                Neither party shall be liable for any delay or failure in the performance of its obligations due to causes beyond its reasonable control, including but not limited to natural disasters, acts of government, war, strikes, lockouts, pandemics, or technical failures. The affected Party shall promptly notify the other, and obligations shall be suspended for the duration of the event.
              </p>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">6. Dispute Resolution</h3>
              <p className="text-gray-700 mb-6">
                Any disputes arising under or in connection with these Terms shall first be attempted to be resolved amicably. Failing resolution, such disputes shall be referred to a sole arbitrator under the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be Pune, Maharashtra, and the language shall be English. The courts at Pune shall have exclusive jurisdiction.
              </p>

              <h3 className="text-2xl font-bold text-gray-800 mb-4">7. Governing Law</h3>
              <p className="text-gray-700 mb-6">
                These Terms are governed by and construed under the laws of India.
              </p>
              <p className="text-gray-700 mb-6">All disputes are subject to the exclusive jurisdiction of the courts in Pune, Maharashtra, India.</p>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">8. Electronic Acceptance</h3>
              <p className="text-gray-700 mb-6">
                Your digital acknowledgment, e-signature, or continued use of the ProCounsel platform constitutes valid acceptance of these Terms under applicable law. In addition to this document, all counsellors shall also be bound by the provisions of the Counsellor Service Agreement executed with CatalystAI Technology Private Limited.
                By registering and offering services on ProCounsel, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
              </p>
            </section>
            
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Contact & Grievance Officer</h3>
              <p className="text-gray-700 mb-4">
                For questions, feedback, or complaints, please contact:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Company:</strong> CatalystAI Technology Private Limited</p>
                <p className="text-gray-700 mb-2"><strong>Email:</strong> grievance@procounsel.co.in</p>
                <p className="text-gray-700 mb-2"><strong>Website:</strong> www.procounsel.co.in</p>
                <p className="text-gray-700"><strong>Address:</strong> The Address Commercia, Shop No. 427, Near Hinjewadi Bridge, Wakad-411057, Maharashtra, India</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}