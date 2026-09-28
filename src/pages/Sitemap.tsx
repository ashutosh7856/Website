import { Link } from 'react-router-dom';

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add top padding for header spacing */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-22 pb-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 lg:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Sitemap</h1>
            <p className="text-lg text-gray-600">Quick links to important pages on ProCounsel</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { to: "/", label: "Home", icon: "🏠" },
              { to: "/admissions", label: "Admissions", icon: "🎓" },
              { to: "/colleges", label: "Colleges", icon: "🏫" },
              { to: "/pro-buddies", label: "ProBuddies", icon: "🤝" },
              { to: "/study-abroad", label: "Study Abroad", icon: "🌍" },
              { to: "/counsellor-listing", label: "Counsellors", icon: "👥" },
              { to: "/about", label: "About", icon: "ℹ️" },
              { to: "/contact", label: "Contact", icon: "📞" },
              { to: "/privacy-policy", label: "Privacy Policy", icon: "🔒" },
              { to: "/terms", label: "Terms", icon: "📋" },
              { to: "/add-college", label: "Add College", icon: "➕" }
            ].map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                className="group block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-gray-700 group-hover:text-blue-600 font-medium transition-colors">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Back to Home CTA */}
          <div className="mt-12 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <span>🏠</span>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
