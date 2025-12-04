import { Link } from 'react-router-dom'

export function AIVerificationDomain() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-7xl mb-6">🤖</div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            AI Verification & Improvement
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Verify AI output quality with human judgment and prevent bias or hallucinations
          </p>
        </div>

        {/* What is it? */}
        <section className="mb-16 bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What is this domain?</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Generative AI like ChatGPT, Claude, and Gemini are powerful tools, but they sometimes generate incorrect
            information (hallucinations) or produce biased responses.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            TaskBridge workers verify AI outputs from a human perspective, checking for accuracy, cultural appropriateness,
            and bias. They provide improvement suggestions to help you safely deploy AI in production environments.
          </p>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Real-World Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">💬 Customer Support AI</h3>
              <p className="text-gray-600">
                "Have humans check if our chatbot responses are accurate and appropriate before production deployment"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $5-15/conversation
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">📝 AI-Generated Content</h3>
              <p className="text-gray-600">
                "Check AI-written blog posts or marketing copy for factual errors or biases"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $10-25/article
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🌍 Multilingual AI Translation</h3>
              <p className="text-gray-600">
                "Have native speakers verify if AI translations are culturally appropriate and free of mistranslations"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $8-20/document
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">🔍 Content Moderation</h3>
              <p className="text-gray-600">
                "Verify if AI moderation decisions are correct and review edge cases with human judgment"
              </p>
              <div className="mt-4 text-sm text-primary-600 font-medium">
                Price range: $3-10/case
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-16 bg-gradient-to-r from-primary-50 to-purple-50 p-8 rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📤</div>
              <h3 className="font-bold text-gray-900 mb-2">1. Submit AI Output</h3>
              <p className="text-sm text-gray-600">
                Post AI output and evaluation criteria
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-bold text-gray-900 mb-2">2. Worker Assignment</h3>
              <p className="text-sm text-gray-600">
                Match with trained AI verification workers
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="font-bold text-gray-900 mb-2">3. Quality Verification</h3>
              <p className="text-sm text-gray-600">
                Evaluate accuracy, bias, and cultural appropriateness
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-bold text-gray-900 mb-2">4. Receive Report</h3>
              <p className="text-sm text-gray-600">
                Get issues identified and improvement suggestions
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
              <span>Completed AI verification training (30 min, online)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Ability to detect hallucinations (factual errors)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Sensitivity to bias (gender, race, cultural, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Understanding of cultural context</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-3">✓</span>
              <span>Ability to provide structured feedback</span>
            </li>
          </ul>
        </section>

        {/* Why TaskBridge */}
        <section className="mb-16 bg-primary-600 text-white p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Why TaskBridge?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🌏</div>
              <h3 className="font-bold text-lg mb-2">Diverse Perspectives</h3>
              <p className="text-primary-100">
                Detect bias from African and Asian cultural viewpoints
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-lg mb-2">Specialized Training</h3>
              <p className="text-primary-100">
                Workers trained in AI limitations and verification methods
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-bold text-lg mb-2">Scalable</h3>
              <p className="text-primary-100">
                Handle from a few to thousands of verifications
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
            Post AI Verification Task
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
