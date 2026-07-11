import { Mail, Phone, MapPin, Instagram, Linkedin, Sparkles, MessageCircle } from 'lucide-react';
import PageSEO from "@/components/SEO/PageSEO";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageSEO title="Contact ProCounsel — Career & Admission Help" description="Get in touch with ProCounsel for career counselling, college admissions guidance, and support. We're here to help students choose the right path." canonical="/contact" />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-22 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Get in Touch with Us
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
            Contact ProCounsel
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions about college admissions or need career guidance? Our expert counsellors are here to help you make informed decisions about your educational journey.
          </p>
        </div>

        {/* Contact Cards Grid - Simple & Clean */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Phone Contact */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
            <div className="space-y-1 mb-4">
              <a 
                href="tel:7004789484" 
                className="block text-green-600 hover:text-green-700 font-medium transition-colors cursor-pointer"
              >
                +91 7004789484
              </a>
              <a 
                href="tel:9470988669" 
                className="block text-green-600 hover:text-green-700 font-medium transition-colors cursor-pointer"
              >
                +91 9470988669
              </a>
            </div>
            <p className="text-gray-600 text-sm">
              Speak directly with our counsellors
            </p>
          </div>

          {/* Email Contact */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
            <a 
              href="mailto:hr@procounsel.co.in" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors block mb-4 cursor-pointer"
            >
              support@procounsel.co.in
            </a>
            <p className="text-gray-600 text-sm">
              Send us your queries and we&apos;ll get back within 24 hours
            </p>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h3>
            <div className="flex justify-center gap-3 mb-4">
              <a
                href="https://www.instagram.com/procounsel.co.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://www.linkedin.com/company/procounsel-by-catalystai/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              >
                <Linkedin className="w-5 h-5 text-white" />
              </a>
            </div>
            <p className="text-gray-600 text-sm">
              Stay updated with our latest posts
            </p>
          </div>
        </div>

        {/* Office Address - Full Width */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-16">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Office</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-700 leading-relaxed">
                      <p className="font-medium text-gray-900 mb-2">CATALYSTAI TECHNOLOGY PRIVATE LIMITED</p>
                      <p>The Address Commercia</p>
                      <p>Shop No. 427</p>
                      <p>Near Hinjewadi Bridge</p>
                      <p>Wakad-411057</p>
                      <p>Maharashtra, India</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-gray-600">
                      Located in the heart of Pune&apos;s IT hub, our office is easily accessible by public transport. 
                      We welcome visitors during business hours for consultations and guidance sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

  {/* map removed per request; address retained in Office Address card above */}

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            Don&apos;t wait! Connect with our expert counsellors today and take the first step towards your dream career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:7004789484"
              className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-5 h-5" />
              Call Now: +91 7004789484
            </a>
            <a 
              href="mailto:hr@procounsel.co.in"
              className="bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-800 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-5 h-5" />
              Send Email
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}