import Link from "next/link";
import { Navbar, Footer } from "@/components/layout";
import {
  FileText,
  Zap,
  ArrowRight,
  Sparkles,
  Clock,
  Shield,
  Layers,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50">
      <Navbar />

      <main className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-20 h-48 w-48 rounded-full bg-blue-200 opacity-30 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute right-1/4 top-40 h-64 w-64 rounded-full bg-indigo-200 opacity-30 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute bottom-20 left-1/3 h-48 w-48 rounded-full bg-purple-200 opacity-30 blur-3xl sm:h-64 sm:w-64" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 sm:mb-8 sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Automate Your Documents Workflow
            </div>

            {/* Main Heading */}
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:mb-6 sm:text-5xl lg:text-7xl">
              <span className="block">Transform Your</span>
              <span className="block bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Document Creation
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base text-gray-600 sm:mb-10 sm:text-xl">
              PowerAutomate streamlines the process of generating dynamic
              documents from templates. Fill in your data, select a template,
              and get perfectly formatted documents in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/model-creator"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/40 sm:w-auto sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-lg"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Start Creating
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-all hover:border-blue-300 hover:text-blue-600 sm:w-auto sm:rounded-2xl sm:px-8 sm:py-4 sm:text-lg"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Feature Cards */}
          <section id="features" className="mt-16 sm:mt-32">
            <div className="mb-8 text-center sm:mb-12">
              <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-3xl">
                Why PowerAutomate?
              </h2>
              <p className="text-base text-gray-600 sm:text-lg">
                Everything you need to automate your documents workflow
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {/* Feature 1 */}
              <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-lg transition-all hover:border-blue-300 hover:shadow-xl sm:rounded-2xl sm:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
                  Lightning Fast
                </h3>
                <p className="text-sm text-gray-600 sm:text-base">
                  Generate documents in seconds with our optimized template
                  engine. No more manual copying and pasting.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-lg transition-all hover:border-indigo-300 hover:shadow-xl sm:rounded-2xl sm:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <Layers className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
                  Multiple Templates
                </h3>
                <p className="text-sm text-gray-600 sm:text-base">
                  Choose from various document templates. Each template is
                  designed for specific use cases and can be customized.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-lg transition-all hover:border-purple-300 hover:shadow-xl sm:rounded-2xl sm:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
                  Secure & Reliable
                </h3>
                <p className="text-sm text-gray-600 sm:text-base">
                  Your data is processed securely on our servers. Documents are
                  generated reliably every time.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-lg transition-all hover:border-green-300 hover:shadow-xl sm:rounded-2xl sm:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
                  Save Time
                </h3>
                <p className="text-sm text-gray-600 sm:text-base">
                  Reduce document creation time by up to 90%. Focus on what
                  matters while we handle the formatting.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-lg transition-all hover:border-orange-300 hover:shadow-xl sm:rounded-2xl sm:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
                  DOCX Export
                </h3>
                <p className="text-sm text-gray-600 sm:text-base">
                  Export your documents in Microsoft Word format. Compatible
                  with all major office suites.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-lg transition-all hover:border-pink-300 hover:shadow-xl sm:rounded-2xl sm:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 sm:mb-6 sm:h-14 sm:w-14 sm:rounded-2xl">
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 sm:mb-3 sm:text-xl">
                  Live Preview
                </h3>
                <p className="text-sm text-gray-600 sm:text-base">
                  See your document rendered in real-time before downloading.
                  What you see is what you get.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 sm:mt-32">
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-center shadow-2xl sm:rounded-3xl sm:p-12">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative z-10">
                <h2 className="mb-3 text-xl font-bold text-white sm:mb-4 sm:text-3xl lg:text-4xl">
                  Ready to Automate Your Workflow?
                </h2>
                <p className="mb-6 text-sm text-blue-100 sm:mb-8 sm:text-lg">
                  Start creating professional documents in minutes.
                </p>
                <Link
                  href="/model-creator"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-600 shadow-xl transition-all hover:scale-105 sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-lg"
                >
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  Create Your First Document
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
