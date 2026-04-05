import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-primary-600">
            VerifyIQ
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors px-4 py-2"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors px-4 py-2 rounded-lg"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
            Background Verification.{" "}
            <span className="text-primary-500">Simplified.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            The API-first background verification platform that lets companies
            run, track, and manage checks at scale — with real-time results and
            zero manual work.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for Modern Teams
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Everything you need to automate background verification — from a
              single API call to enterprise-grade bulk processing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                API-First Integration
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                RESTful APIs with comprehensive documentation. Submit checks,
                poll status, and retrieve results programmatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Real-time Webhooks
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Get instant notifications when checks complete. No polling
                required — results are pushed to your endpoint as they arrive.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Processing
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Upload hundreds of candidates via CSV or batch API. Track
                progress across all checks from a single dashboard.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Risk Scoring
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Automated risk assessment with configurable thresholds. Get
                clear, actionable scores for every candidate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Go from sign-up to verified results in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-500 text-white text-xl font-bold flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                Sign Up
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Create your account, generate API keys, and configure your
                verification packages in minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-500 text-white text-xl font-bold flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                Submit via API or Portal
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Send candidate data through the REST API, upload a CSV, or use
                the web portal — whatever fits your workflow.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-500 text-white text-xl font-bold flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                Get Results via Webhook
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Receive verified results in real time through webhooks, or check
                status any time via the API and dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Start Verifying Today
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Set up your first background check in under five minutes. No
            contracts, no minimums.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-primary-700 bg-white hover:bg-gray-100 rounded-lg transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-primary-600">
            VerifyIQ
          </span>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} VerifyIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
