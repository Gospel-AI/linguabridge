import { Link } from 'react-router-dom'

export function PhysicalDataDomain() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-7xl mb-6">📍</div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Data Collection & Verification (Physical)
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Local workers visit locations in person to collect real-world information and data
          </p>
        </div>

        {/* What is it? */}
        <section className="mb-16 bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What is this domain?</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Sometimes you need on-the-ground information that can't be found online: competitor store pricing,
            new store appearances, specific location conditions. Information that requires someone to actually be there.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            TaskBridge workers go to specified locations, take photos, collect information, and report back with
            structured data. GPS verification ensures they actually visited the location as requested.
          </p>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Real-World Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">💰 Competitive Price Research</h3>
              <p className="text-gray-600">
                "Take photos of competitor store pricing displays and get real-time price information"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $5-15/store
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🏪 Store Audits</h3>
              <p className="text-gray-600">
                "Verify that our franchise locations are operating to standards by checking exterior and interior"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $8-20/store
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">📸 Location Photography</h3>
              <p className="text-gray-600">
                "Get detailed photos of property exteriors, surroundings, and the route from the nearest station"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $10-25/property
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🗺️ Market Research</h3>
              <p className="text-gray-600">
                "Survey emerging markets on-site for store counts and price ranges in specific categories"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $15-40/area
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-16 bg-gradient-to-r from-primary-50 to-green-50 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="font-bold text-gray-900 mb-2">1. Specify Location</h3>
              <p className="text-sm text-gray-600">
                Provide address or coordinates and information to collect
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚶</div>
              <h3 className="font-bold text-gray-900 mb-2">2. Worker Visits</h3>
              <p className="text-sm text-gray-600">
                Nearby workers go to the location in person
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="font-bold text-gray-900 mb-2">3. Data Collection</h3>
              <p className="text-sm text-gray-600">
                Take photos, record information, and capture GPS data
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-bold text-gray-900 mb-2">4. Receive Report</h3>
              <p className="text-sm text-gray-600">
                Get photos and data in a structured report
              </p>
            </div>
          </div>
        </section>

        {/* Quality Assurance */}
        <section className="mb-16 bg-yellow-50 p-8 rounded-2xl border-2 border-yellow-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Quality Assurance System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📡</div>
              <h3 className="font-bold text-gray-900 mb-2">GPS Verification</h3>
              <p className="text-sm text-gray-600">
                Automatically verify photo location is within specified area
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🖼️</div>
              <h3 className="font-bold text-gray-900 mb-2">Photo Quality Check</h3>
              <p className="text-sm text-gray-600">
                Auto-detect resolution, brightness, and blur
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="font-bold text-gray-900 mb-2">Timestamp</h3>
              <p className="text-sm text-gray-600">
                Record capture time to ensure information freshness
              </p>
            </div>
          </div>
        </section>

        {/* Worker Requirements */}
        <section className="mb-16 bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Worker Requirements</h2>
          <ul className="space-y-3 text-lg text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Completed physical data collection training (25 min, online)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Own smartphone with GPS and camera</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Basic photography skills (composition, brightness, focus)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Understanding of privacy and security</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Mobility to travel to specified locations</span>
            </li>
          </ul>
        </section>

        {/* Why TaskBridge */}
        <section className="mb-16 bg-primary-600 text-white p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Why TaskBridge?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="font-bold text-lg mb-2">Global Coverage</h3>
              <p className="text-primary-100">
                Wide coverage across Africa and Asia
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-lg mb-2">Quick Response</h3>
              <p className="text-primary-100">
                Get results within hours to 24 hours
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-lg mb-2">Reliability</h3>
              <p className="text-primary-100">
                Automated GPS and photo quality verification
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
            Post Data Collection Task
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
