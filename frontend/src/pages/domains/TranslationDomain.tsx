import { Link } from 'react-router-dom'

export function TranslationDomain() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-7xl mb-6">🌐</div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Translation & Localization Validation
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Verify translation quality with native speakers to ensure your global expansion succeeds
          </p>
        </div>

        {/* What is it? */}
        <section className="mb-16 bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What is this domain?</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Machine translations or translation agency outputs may be grammatically correct but culturally inappropriate
            or miss important nuances. What sounds natural in one language might feel awkward in another.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            TaskBridge workers who are native speakers evaluate your content from a local perspective and provide
            specific feedback on how to improve it. Get the insider view before launching in new markets.
          </p>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Real-World Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🎯 Marketing Materials</h3>
              <p className="text-gray-600">
                "I need to verify that our ad copy for emerging markets actually resonates with local audiences"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $15-40/task
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">📱 App Localization</h3>
              <p className="text-gray-600">
                "Check if our app's UI translations sound natural and button labels are clear to native speakers"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $10-30/screen
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🌍 Website Content</h3>
              <p className="text-gray-600">
                "Before launching our multilingual website, ensure content is culturally appropriate for each market"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $20-50/page
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">📄 Business Documents</h3>
              <p className="text-gray-600">
                "Have experts review if our contract and proposal translations work well in business contexts"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $30-80/document
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-16 bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="font-bold text-gray-900 mb-2">1. Post Task</h3>
              <p className="text-sm text-gray-600">
                Provide source text, translation, and evaluation criteria
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-bold text-gray-900 mb-2">2. Worker Matching</h3>
              <p className="text-sm text-gray-600">
                Auto-match by language pair and domain experience
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="font-bold text-gray-900 mb-2">3. Review</h3>
              <p className="text-sm text-gray-600">
                Native speakers evaluate naturalness and cultural appropriateness
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-gray-900 mb-2">4. Feedback</h3>
              <p className="text-sm text-gray-600">
                Receive ratings and specific improvement suggestions
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
              <span>Native speaker of target language (or equivalent proficiency)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Completed translation evaluation training (30 min, online)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Understanding of cultural context and language nuances</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Ability to provide structured, actionable feedback</span>
            </li>
          </ul>
        </section>

        {/* Why TaskBridge */}
        <section className="mb-16 bg-primary-600 text-white p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Why TaskBridge?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-lg mb-2">Fast</h3>
              <p className="text-primary-100">
                Get results in hours to 1 day
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-bold text-lg mb-2">Cost-Effective</h3>
              <p className="text-primary-100">
                1/3 to 1/5 the cost of translation agencies
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="font-bold text-lg mb-2">Local Perspective</h3>
              <p className="text-primary-100">
                Real insights from people living in target markets
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
            Post Translation Check Task
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
