import PageSEO from "@/components/SEO/PageSEO";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO title="Privacy Policy | ProCounsel" description="How ProCounsel collects, uses, and protects your personal data across our career counselling and admissions services." canonical="/privacy-policy" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 lg:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Last Updated: 20th August, 2025</p>
            <p className="text-sm text-gray-500 mt-2">ProCounsel - A product of CATALYSTAI TECHNOLOGY PRIVATE LIMITED</p>
          </div>

          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-8">
              ProCounsel is a digital platform owned and operated by <strong>CatalystAI Technology Private Limited</strong>. The platform acts as a trusted bridge between students seeking admission-related guidance and verified education counsellors who offer professional support.
            </p>
            <p className="text-lg text-gray-700 mb-8">
              Our mission is to make the education admission process in India more transparent, accessible, and personalized. To achieve this, we collect and process certain information from both Users (students) and Counsellors.
            </p>
            <p className="text-lg text-gray-700 mb-8">
               This Privacy Policy describes in detail the type of information we collect, why we collect it, how we use it, how we protect it, and the choices available to both Users and Counsellors. By using ProCounsel, you agree to the practices outlined in this Privacy Policy.
            </p>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Section A: Privacy Policy for Users (Students)</h2>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">1. Information We Collect from Users</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>Personal Information:</strong> Name, email address, phone number, profile photo, and other details you voluntarily provide. For purchasing ProCoins, you will be redirected to our trusted payment gateway (Razorpay). We do not store your card, UPI, or other sensitive payment details on our servers.</p>
                <p><strong>Educational Interests:</strong> Information about the courses, colleges, or exams you search, explore, or mark as interested.</p>
                <p><strong>Counsellor Interactions:</strong> Messages, chat history, appointment bookings, feedback, and ratings exchanged between you and counsellors.</p>
                <p><strong>Device Information:</strong> Device model, operating system, IP address, app usage logs, and permissions you grant to the app.</p>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">2. Permissions We Request from Users</h3>
              <p className="text-gray-700 mb-4">To ensure smooth functioning of the app and to provide full access to features, ProCounsel requests the following Android permissions:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Camera:</strong> allows you to capture a profile photo or upload required admission documents directly using your phone’s camera to chats.</li>
                <li><strong>Read Media Images:</strong> allows selection of images from your gallery for uploading (profile photos, ID proofs, certificates, etc.).</li>
                <li><strong>Read & Write External Storage:</strong> ensures backward compatibility on older devices for saving and accessing admission-related files and images.</li>
                <li><strong>Post Notifications:</strong> used to send you real-time alerts about appointment confirmations, reminders, chat messages, subscription updates, and other relevant information.</li>
                <li><strong>Internet:</strong> required to connect you with counsellors, load real-time college/course/exam information, and enable chat functionality.</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">3. How We Use User Information</h3>
               <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To connect you with verified education counsellors who match your interests.</li>
                <li>To enable appointment scheduling, subscription management, and chat features.</li>
                <li>To allow counsellors to provide personalized and ongoing admission guidance.</li>
                <li>To provide you access to updated information on colleges, courses, and entrance exams across India.</li>
                <li>To deliver timely notifications about reminders, updates, or promotional offers.</li>
                <li>To improve the quality of our app by analyzing app usage patterns and user feedback.</li>
              </ul>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">4. Data Sharing & Security (Users)</h3>
              <p className="text-gray-700 mb-4">We do not sell, rent, or trade your personal data to third parties. Your data is shared only with:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Counsellors</strong> you book or subscribe to, in order to allow them to provide accurate advice.</li>
                <li><strong>Trusted service providers</strong> like payment gateway (Razorpay) and Firebase, which support app functionality.</li>
              </ul>
              <p className="text-gray-700">We follow industry-standard security practices, including encryption, access control, and secure storage, to safeguard your data from unauthorized access.</p>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">5. Your Choices as a User</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You may withdraw any permission (camera, storage, location, etc.) from your device settings. However, certain features may not work without the respective permission.</li>
                <li>You may unsubscribe from a counsellor or delete your account entirely by writing to us at hr@procounsel.co.in.</li>
                <li>You can also manage notification preferences within your device or app settings.</li>
                <li>We facilitate the purchase of ProCoins (₹1 = 1 ProCoin) through our trusted payment gateway (Razorpay). Users can then use these ProCoins to subscribe to counsellors or access other paid services within the app.</li>
              </ul>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">6. Children’s Privacy</h3>
              <p className="text-gray-700">ProCounsel is not intended for children under the age of 13. If we become aware that a child under 13 has registered or provided information, we will delete such data promptly.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Section B: Privacy Policy for Counsellors</h2>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">1. Information We Collect from Counsellors</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>Professional Information:</strong> Full name, email address, phone number, profile photo, qualification details, years of experience, expertise in courses/colleges, and office address.</p>
                <p><strong>Financial Information:</strong> Counsellors earn ProCoins when users subscribe to their services. Counsellors can request a withdrawal of their ProCoins into real money via our app. We process such requests and transfer the equivalent amount to the counsellor’s registered bank account.</p>
                <p><strong>Counsellor Interactions:</strong> Messages, appointment records, chat/call logs, and feedback received from students.</p>
                <p><strong>Device Information:</strong> Device type, operating system, and permissions you grant within the app.</p>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">2. Permissions We Request from Counsellors</h3>
              <p className="text-gray-700 mb-4">To ensure smooth functioning of the app and to provide full access to features, ProCounsel requests the following Android permissions:</p>
               <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Camera:</strong> allows you to capture a profile photo or upload required admission documents directly using your phone’s camera to chats.</li>
                <li><strong>Read Media Images:</strong> allows selection of images from your gallery for uploading (profile photos, ID proofs, certificates, etc.).</li>
                <li><strong>Read & Write External Storage:</strong> ensures backward compatibility on older devices for saving and accessing admission-related files and images.</li>
                <li><strong>Post Notifications:</strong> used to send you real-time alerts about appointment confirmations, reminders, chat messages, subscription updates, and other relevant information.</li>
                <li><strong>Internet:</strong> required to connect you with users, load real-time college/course/exam information, and enable chat functionality.</li>
                <li><strong>Location (Fine and Coarse):</strong> Counsellor can set their office premises location so that it will be easier for the user to reach to office.</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">3. How We Use Counsellor Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Verify your professional background and create a trusted profile on the platform.</li>
                <li>Display your profile to relevant students based on their preferences.</li>
                <li>Facilitate appointment booking, subscription management, and ongoing communication with students.</li>
                <li>Help improve counsellor visibility by showing accurate location, services, and expertise.</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">4. Data Sharing & Security (Counsellors)</h3>
              <p className="text-gray-700 mb-4">We do not share your professional or personal data with unrelated third parties. Data is shared only with:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Students</strong> who explore or book your counselling services.</li>
                  <li><strong>Service providers</strong> (payment processing, cloud hosting, Firebase notifications).</li>
              </ul>
              <p className="text-gray-700">Security measures are applied to prevent unauthorized access, fraud, or misuse of counsellor information.</p>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">5. Counsellor Rights & Choices</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You may withdraw specific permissions (camera, location, notifications), but doing so may limit your ability to provide services effectively.</li>
                  <li>You can update or modify your profile, office location, or availability at any time.</li>
                  <li>You may request deletion of your counsellor account and related data by contacting us at hr@procounsel.co.in.</li>
                  <li>We facilitate the withdrawal of ProCoins (₹1 = 1 ProCoin) through our trusted payment gateway (Razorpay). Counsellors can then use these ProCoins to make withdrawal request via their profile.</li>
              </ul>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">6. Children’s Privacy (Counsellors)</h3>
              <p className="text-gray-700">The platform expects all counsellors to be adults above 18 years of age with professional capacity to guide students. Counsellors below 18 are not allowed to register.</p>
            </section>
            
            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Section C: General Terms Applicable to Both Users and Counsellors</h2>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Updates to This Policy</h3>
              <p className="text-gray-700 mb-4">We may update this Privacy Policy periodically to reflect changes in technology, regulations, or app features. Updates will be published within the app and on our official website.</p>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Explicit Consent Clause</h3>
              <p className="text-gray-700 mb-4">By creating an account or using the ProCounsel app, you provide explicit consent for the collection, storage, and use of your personal and professional data in accordance with this Privacy Policy. You may withdraw consent at any time by deleting your account or contacting us at hr@procounsel.co.in.</p>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Data Retention</h3>
              <p className="text-gray-700 mb-4">We retain personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by applicable law. Upon account deletion, your personal data will be securely deleted or anonymized within 30 days, unless retention is required for legal, regulatory, or fraud-prevention purposes.</p>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Data Protection & Security Compliance</h3>
              <p className="text-gray-700 mb-4">We adhere to the principles of the Digital Personal Data Protection Act, 2023, and follow industry-standard safeguards including data encryption, secure servers, and restricted employee access to ensure your personal information is protected.</p>
              <p className="text-gray-700 mb-4"><strong>Data Sharing with Authorities:</strong> We may disclose user or counsellor information to government or law enforcement agencies when required by law, including under the Information Technology Act, 2000, or any other applicable legal process.</p>
              <p className="text-gray-700 mb-4"><strong>Cross-border Data Transfers:</strong> In cases where data is processed or stored outside India, we ensure that such transfers comply with applicable Indian data protection laws and are subject to adequate safeguards to protect your personal information.</p>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Grievance Officer (As per DPDPA 2023)</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Name:</strong> Aswini Verma </p>
                <p className="text-gray-700 mb-2"><strong>Designation:</strong> Grievance Officer, ProCounsel</p>
                <p className="text-gray-700 mb-2"><strong>Email:</strong> support@procounsel.co.in </p>
                <p className="text-gray-700"><strong>Address:</strong> The Address Commercia, Shop No. 427, Near Hinjewadi Bridge, Wakad-411057, Maharashtra, India</p>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Cookie & Tracking Policy</h3>
              <p className="text-gray-700 mb-4">We may use cookies and analytics tools to improve user experience and app performance. Users may disable cookies through their browser settings, though some features may not function properly.</p>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Contact Us</h3>
              <p className="text-gray-700 mb-4">For any questions, requests, or complaints regarding this Privacy Policy, please contact:</p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>CatalystAI Technology Private Limited</strong></p>
                <p className="text-gray-700 mb-2"><strong>Email:</strong> hr@procounsel.co.in</p>
                <p className="text-gray-700 mb-2"><strong>Website:</strong> www.procounsel.co.in</p>
                <p className="text-gray-700"><strong>Address:</strong> The Address Commercia, Shop No. 427, Near Hinjewadi Bridge, Wakad-411057, Maharashtra, India</p>
              </div>
            </section>
            
            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-600 italic">This Privacy Policy is effective as of 20th August, 2025, and applies to all users of the ProCounsel platform.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}