import { Package, RefreshCw, Info, AlertCircle } from 'lucide-react';
import PageSEO from "@/components/SEO/PageSEO";

export default function ShippingExchangePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO title="Shipping & Exchange Policy | ProCounsel" description="ProCounsel's shipping and exchange policy for physical and digital products and services." canonical="/shipping-exchange" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 lg:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Shipping & Exchange Policy</h1>
            <p className="text-lg text-gray-600">Last Updated: 5th November, 2025</p>
            <p className="text-sm text-gray-500 mt-2">ProCounsel - A product of CATALYSTAI TECHNOLOGY PRIVATE LIMITED</p>
          </div>

          {/* Main Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-8 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <Info className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Digital Services Only</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  ProCounsel is a <strong>100% digital platform</strong> that provides online education counseling services. 
                  We <strong>do not sell, manufacture, or distribute any physical products</strong>. Therefore, we do not have 
                  shipping, delivery, or exchange policies applicable to physical goods.
                </p>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">What We Offer</h2>
              
              <p className="text-lg text-gray-700 mb-6">
                ProCounsel provides the following <strong>digital services</strong> to students seeking admission guidance:
              </p>

              <div className="space-y-4">
                <div className="bg-orange-50 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">🎓 Online Counseling Sessions</h4>
                  <p className="text-gray-700">Connect with verified education counselors through chat, voice, or video calls for personalized admission guidance.</p>
                </div>
                <div className="bg-orange-50 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">💬 Digital Chat Support</h4>
                  <p className="text-gray-700">Real-time messaging with counselors to get your queries answered instantly.</p>
                </div>
                <div className="bg-orange-50 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">📅 Appointment Booking</h4>
                  <p className="text-gray-700">Schedule counseling sessions at your convenience through our digital platform.</p>
                </div>
                <div className="bg-orange-50 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">📚 Educational Information</h4>
                  <p className="text-gray-700">Access comprehensive information about colleges, courses, and entrance exams across India.</p>
                </div>
                <div className="bg-orange-50 p-5 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">💰 ProCoins (Digital Currency)</h4>
                  <p className="text-gray-700">Purchase digital credits (ProCoins) to subscribe to counseling services within the app.</p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">No Physical Products</h2>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <Package className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Important Notice</h3>
                    <p className="text-gray-700">
                      Since ProCounsel operates as a digital-only platform, the following policies <strong>do not apply</strong>:
                    </p>
                    <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                      <li>Shipping or delivery of physical items</li>
                      <li>Packaging or handling charges</li>
                      <li>Product exchange or replacement</li>
                      <li>Return of physical goods</li>
                      <li>Damaged or defective product claims</li>
                      <li>Courier or logistics services</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Service Delivery</h2>
              
              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Instant Digital Access</h3>
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <p className="text-gray-700 mb-4">
                  All our services are delivered <strong>instantly and digitally</strong> through the ProCounsel platform:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>ProCoins Purchase:</strong> Credits are added to your wallet immediately after successful payment</li>
                  <li><strong>Counselor Subscription:</strong> Access is granted instantly upon subscription</li>
                  <li><strong>Chat Services:</strong> Available in real-time through the app</li>
                  <li><strong>Information Access:</strong> College, course, and exam details are accessible 24/7</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">No Waiting Period</h3>
              <p className="text-gray-700">
                Unlike physical product deliveries, there is <strong>no shipping time or delivery delay</strong> for our services. 
                You can start using our platform and connect with counselors immediately after registration and payment.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Service Exchange Policy</h2>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <RefreshCw className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Changing Counselors</h3>
                    <p className="text-gray-700 mb-3">
                      While we don't have a traditional "exchange" policy for physical goods, you have the following options 
                      regarding counseling services:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li>You can subscribe to multiple counselors based on your needs</li>
                      <li>You can choose to not renew a subscription with a particular counselor</li>
                      <li>You can explore and connect with different counselors on the platform</li>
                      <li>If you face service quality issues, you can report to our support team</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Service Modification</h3>
              <p className="text-gray-700 mb-4">
                For changes to your subscription or services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Contact your assigned counselor directly through the app for rescheduling appointments</li>
                <li>Modify your preferences in the dashboard settings</li>
                <li>Cancel subscriptions according to our <a href="/cancellation-refund" className="text-orange-600 hover:text-orange-700 underline">Cancellation & Refund Policy</a></li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Technical Issues & Support</h2>
              
              <p className="text-gray-700 mb-4">
                If you experience any technical issues with our digital services, such as:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>ProCoins not reflecting in your wallet after payment</li>
                <li>Unable to access subscribed counselor services</li>
                <li>Chat or appointment booking not working</li>
                <li>App functionality problems</li>
              </ul>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Contact Our Support Team</h4>
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-gray-700">We're here to help! Reach out to us at:</span>
                </div>
                <a 
                  href="mailto:support@procounsel.co.in" 
                  className="text-xl font-semibold text-orange-600 hover:text-orange-700 underline block mt-2"
                >
                  support@procounsel.co.in
                </a>
                <p className="text-sm text-gray-600 mt-3">
                  Our support team typically responds within 24-48 hours during business days.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Refund Policy</h2>
              
              <p className="text-gray-700 mb-4">
                For information about cancellations and refunds for digital services, please refer to our detailed:
              </p>
              <a 
                href="/cancellation-refund" 
                className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Cancellation & Refund Policy
              </a>
            </section>

            <section className="mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Data Security</h2>
              
              <p className="text-gray-700 mb-4">
                While we don't handle physical product deliveries, we take the security of your digital data seriously:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>All payment transactions are processed through secure payment gateways (Razorpay)</li>
                <li>Your personal information is encrypted and stored securely</li>
                <li>We do not store sensitive payment details like card numbers or CVV</li>
                <li>Chat conversations are protected and accessible only to you and your subscribed counselors</li>
              </ul>
              <p className="text-gray-700 mt-4">
                For more details, please review our <a href="/privacy-policy" className="text-orange-600 hover:text-orange-700 underline">Privacy Policy</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Contact Information</h2>
              
              <p className="text-gray-700 mb-4">
                If you have any questions about our digital services or need assistance:
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Package className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Email Support</p>
                      <a href="mailto:support@procounsel.co.in" className="text-lg font-semibold text-blue-600 hover:text-blue-700 underline">
                        support@procounsel.co.in
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="text-gray-800 font-semibold">CATALYSTAI TECHNOLOGY PRIVATE LIMITED</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Office Address</p>
                      <p className="text-gray-700 text-sm">
                        The Address Commercia, Shop No. 427,<br />
                        Near Hinjewadi Bridge, Wakad-411057,<br />
                        Maharashtra, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Updates to This Policy</h2>
              
              <p className="text-gray-700">
                ProCounsel reserves the right to update or modify this Shipping & Exchange Policy at any time. 
                Any changes will be posted on this page with an updated "Last Updated" date. As we continue to 
                operate as a digital-only platform, this policy will remain focused on our online services.
              </p>
            </section>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 p-6 rounded-lg mt-8">
              <div className="flex items-start">
                <Info className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                <p className="text-gray-700">
                  <strong>Summary:</strong> ProCounsel is a 100% digital platform providing online education counseling services. 
                  We do not sell physical products, and therefore, traditional shipping and exchange policies do not apply. 
                  All services are delivered instantly through our digital platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
