import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
            <span className="block">LLM Annotation</span>
            <span className="block text-primary-600">Platform</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            High-quality multilingual data annotation for AI training.
            Specialized in African and Southeast Asian languages.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Start Annotating
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-primary-600 text-4xl font-bold mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Multilingual Focus
            </h3>
            <p className="text-gray-600">
              Specialized in African languages (Akan, Hausa, Yoruba, Igbo) and Turkish
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-primary-600 text-4xl font-bold mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              50% Lower Cost
            </h3>
            <p className="text-gray-600">
              Competitive pricing compared to Scale AI and Appen
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-primary-600 text-4xl font-bold mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quality Assured
            </h3>
            <p className="text-gray-600">
              Inter-annotator agreement and gold standard validation
            </p>
          </div>
        </div>

        {/* Annotation Types Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Annotation Types
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional data annotation for training your AI models
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Text Classification */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🏷️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Text Classification</h3>
              <p className="text-gray-600 mb-4">
                Sentiment analysis, topic classification, safety labels, and more
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Sentiment</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Topics</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Safety</span>
              </div>
            </div>

            {/* NER */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Named Entity Recognition</h3>
              <p className="text-gray-600 mb-4">
                Entity tagging for NLP models and information extraction
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">People</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Locations</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Organizations</span>
              </div>
            </div>

            {/* RLHF */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">⚖️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">RLHF Ranking</h3>
              <p className="text-gray-600 mb-4">
                Preference learning and response ranking for LLM training
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Comparison</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Ranking</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Preference</span>
              </div>
            </div>

            {/* Text Evaluation */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Text Evaluation</h3>
              <p className="text-gray-600 mb-4">
                Quality assessment for AI-generated content
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Quality</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Fluency</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Accuracy</span>
              </div>
            </div>

            {/* Translation Validation */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Translation Validation</h3>
              <p className="text-gray-600 mb-4">
                Machine translation quality check and error annotation
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">MT QA</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Error Types</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">Fluency</span>
              </div>
            </div>

            {/* Batch Processing */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Batch Processing</h3>
              <p className="text-gray-600 mb-4">
                Upload 1,000-10,000+ tasks at once via CSV or JSON
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">CSV</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">JSON</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Languages */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Supported Languages
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Native speakers for accurate multilingual annotation
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl mb-2">🇬🇧</div>
              <h4 className="font-semibold">English</h4>
              <p className="text-sm text-gray-500">Global</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl mb-2">🇬🇭</div>
              <h4 className="font-semibold">Akan (Twi)</h4>
              <p className="text-sm text-gray-500">Ghana</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl mb-2">🇳🇬</div>
              <h4 className="font-semibold">Hausa</h4>
              <p className="text-sm text-gray-500">Nigeria</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl mb-2">🇳🇬</div>
              <h4 className="font-semibold">Yoruba</h4>
              <p className="text-sm text-gray-500">Nigeria</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl mb-2">🇳🇬</div>
              <h4 className="font-semibold">Igbo</h4>
              <p className="text-sm text-gray-500">Nigeria</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl mb-2">🇳🇬</div>
              <h4 className="font-semibold">Nigerian Pidgin</h4>
              <p className="text-sm text-gray-500">Nigeria</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl mb-2">🇹🇷</div>
              <h4 className="font-semibold">Turkish</h4>
              <p className="text-sm text-gray-500">North Cyprus</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center border-2 border-dashed border-gray-300">
              <div className="text-3xl mb-2">➕</div>
              <h4 className="font-semibold text-gray-400">More Coming</h4>
              <p className="text-sm text-gray-400">Swahili, Thai...</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pay per task. 50-70% lower than major competitors.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Task Type</th>
                    <th className="px-6 py-4 text-center">LinguaBridge</th>
                    <th className="px-6 py-4 text-center">Scale AI</th>
                    <th className="px-6 py-4 text-center">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">Text Classification</td>
                    <td className="px-6 py-4 text-center font-semibold text-primary-600">$0.03-0.08</td>
                    <td className="px-6 py-4 text-center text-gray-500">$0.10-0.30</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">60-70%</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4">NER</td>
                    <td className="px-6 py-4 text-center font-semibold text-primary-600">$0.08-0.15</td>
                    <td className="px-6 py-4 text-center text-gray-500">$0.20-0.50</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">60-70%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">RLHF Ranking</td>
                    <td className="px-6 py-4 text-center font-semibold text-primary-600">$0.15-0.30</td>
                    <td className="px-6 py-4 text-center text-gray-500">$0.50-1.00</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">70%</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4">Translation Validation</td>
                    <td className="px-6 py-4 text-center font-semibold text-primary-600">$0.10-0.20</td>
                    <td className="px-6 py-4 text-center text-gray-500">$0.30-0.60</td>
                    <td className="px-6 py-4 text-center text-green-600 font-semibold">60-70%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-center text-gray-500 mt-4">
              Volume discounts available for 5,000+ tasks
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to start annotating?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your first batch of tasks and get high-quality annotations from native speakers.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  )
}
