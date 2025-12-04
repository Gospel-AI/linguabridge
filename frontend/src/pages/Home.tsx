import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
            <span className="block">Global Micro Task</span>
            <span className="block text-primary-600">Marketplace</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Connect companies with talented workers worldwide.
            Get your tasks done efficiently and affordably.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-primary-600 text-4xl font-bold mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Global Reach
            </h3>
            <p className="text-gray-600">
              Access a worldwide network of talented workers ready to help with your tasks
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-primary-600 text-4xl font-bold mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Fast & Simple
            </h3>
            <p className="text-gray-600">
              Get started in 5 minutes. No complex plans or hidden fees
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-primary-600 text-4xl font-bold mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Fair Pricing
            </h3>
            <p className="text-gray-600">
              Transparent 18% platform fee. No surprises, just honest pricing
            </p>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How can TaskBridge help you?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Here are some real-world examples of how our platform can solve your challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Translation/Localization */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="text-5xl mr-4">🌐</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Translation Check</h3>
                  <p className="text-sm text-primary-600 font-medium">Localization Validation</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 italic">
                  "I need someone to check if my Japanese marketing materials sound natural to native speakers."
                </p>
              </div>
              <p className="text-gray-600">
                Get native speakers to verify translations, check cultural appropriateness, and ensure your message resonates with local audiences.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Marketing materials</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">App localization</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Website content</span>
              </div>
              <div className="mt-6">
                <Link
                  to="/domains/translation"
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  Learn more →
                </Link>
              </div>
            </div>

            {/* AI Verification */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="text-5xl mr-4">🤖</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">AI Quality Check</h3>
                  <p className="text-sm text-primary-600 font-medium">AI Verification & Improvement</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 italic">
                  "I want to make sure ChatGPT's customer support responses are accurate and appropriate before we use them."
                </p>
              </div>
              <p className="text-gray-600">
                Have humans verify AI-generated content for accuracy, detect bias or hallucinations, and ensure cultural sensitivity.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Chatbot responses</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">AI translations</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Content moderation</span>
              </div>
              <div className="mt-6">
                <Link
                  to="/domains/ai-verification"
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  Learn more →
                </Link>
              </div>
            </div>

            {/* Physical Data Collection */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="text-5xl mr-4">📍</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">On-Site Verification</h3>
                  <p className="text-sm text-primary-600 font-medium">Physical Data Collection</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 italic">
                  "I need someone to visit competitor stores and take photos of their pricing displays."
                </p>
              </div>
              <p className="text-gray-600">
                Send workers to specific locations to collect data, take photos, verify information, or conduct on-site research.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Price checking</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Store audits</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Location photos</span>
              </div>
              <div className="mt-6">
                <Link
                  to="/domains/physical-data"
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  Learn more →
                </Link>
              </div>
            </div>

            {/* Mobile App Testing */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="text-5xl mr-4">📱</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">App User Testing</h3>
                  <p className="text-sm text-primary-600 font-medium">Mobile App & Game Testing</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 italic">
                  "I need real users to test my new app and give feedback on the user experience."
                </p>
              </div>
              <p className="text-gray-600">
                Get real users to test your apps or games, find bugs, evaluate UX/UI, and provide honest feedback before launch.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Beta testing</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">UX feedback</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Bug hunting</span>
              </div>
              <div className="mt-6">
                <Link
                  to="/domains/app-testing"
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                  Learn more →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              These are just a few examples. TaskBridge handles any micro task that requires human judgment!
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Start Your First Task
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
