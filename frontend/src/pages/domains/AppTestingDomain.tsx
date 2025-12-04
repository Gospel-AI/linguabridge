import { Link } from 'react-router-dom'

export function AppTestingDomain() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-7xl mb-6">📱</div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Mobile App & Game Testing
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Discover issues before launch with real user testing of your apps and games
          </p>
        </div>

        {/* What is it? */}
        <section className="mb-16 bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What is this domain?</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Internal testing alone can't catch all the bugs and UX issues that real users encounter.
            Development teams become too familiar with their products and lose the perspective of first-time users.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            TaskBridge workers use your apps and games as actual users would, reporting bugs, usability issues,
            and confusing elements in detail. Testing on diverse devices and environments significantly reduces
            post-launch problems.
          </p>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Real-World Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🧪 Beta Testing</h3>
              <p className="text-gray-600">
                "Have real users try our app before launch to find bugs and areas for improvement"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $10-30/tester
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🎯 UX Feedback</h3>
              <p className="text-gray-600">
                "Evaluate new feature usability and get specific feedback on pain points"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $15-40/session
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🐛 Bug Hunting</h3>
              <p className="text-gray-600">
                "Discover issues beyond known bugs that occur during real-world usage"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $20-50/hour
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🎮 Game Playtesting</h3>
              <p className="text-gray-600">
                "Evaluate game difficulty balance, fun factor, and clarity through actual gameplay"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $15-45/session
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-16 bg-gradient-to-r from-primary-50 to-pink-50 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-bold text-gray-900 mb-2">1. Specify Test Requirements</h3>
              <p className="text-sm text-gray-600">
                App info, test objectives, device requirements
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-bold text-gray-900 mb-2">2. Tester Selection</h3>
              <p className="text-sm text-gray-600">
                Match based on device and experience
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="font-bold text-gray-900 mb-2">3. Actual Usage</h3>
              <p className="text-sm text-gray-600">
                Follow specified scenarios to operate and evaluate
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-gray-900 mb-2">4. Create Report</h3>
              <p className="text-sm text-gray-600">
                Submit bugs, UX issues, and improvement suggestions
              </p>
            </div>
          </div>
        </section>

        {/* Test Coverage */}
        <section className="mb-16 bg-blue-50 p-8 rounded-2xl border-2 border-blue-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Diverse Test Environments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📱 Device Coverage</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  Android (various manufacturers & versions)
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  iOS (iPhone & iPad)
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  Low-spec to high-end devices
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  Various screen sizes and resolutions
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">🌐 Network Conditions</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  High-speed Wi-Fi
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  Mobile data (4G/5G)
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  Slow or unstable connections
                </li>
                <li className="flex items-center">
                  <span className="text-primary-600 mr-2">•</span>
                  Offline operation
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Worker Requirements */}
        <section className="mb-16 bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Worker Requirements</h2>
          <ul className="space-y-3 text-lg text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Completed app & game testing training (30 min, online)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Own smartphone or tablet</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Ability to clearly explain bug reproduction steps</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Basic skills in screenshots and screen recording</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Observational skills to provide specific UX feedback</span>
            </li>
          </ul>
        </section>

        {/* Why TaskBridge */}
        <section className="mb-16 bg-primary-600 text-white p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Why TaskBridge?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="font-bold text-lg mb-2">Real Users</h3>
              <p className="text-primary-100">
                Test with users from your actual target markets
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="font-bold text-lg mb-2">Diverse Devices</h3>
              <p className="text-primary-100">
                Various devices, OS versions, and network conditions
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-lg mb-2">Quick Feedback</h3>
              <p className="text-primary-100">
                Get detailed reports within 24-48 hours
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/tasks/new"
            className="inline-flex items-center px-10 py-4 text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all"
          >
            Post App Testing Task
          </Link>
          <p className="mt-4 text-gray-600">
            or{' '}
            <Link to="/" className="text-primary-600 hover:underline">
              return to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
