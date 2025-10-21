/**
 * Footer Component
 * Minimalist horizontal footer inspired by RateMyProfessors
 */

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black text-gray-400 mt-auto border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Links Row */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm mb-4">
          <Link href="/help" className="hover:text-white transition-colors">
            Help
          </Link>
          <Link href="/guidelines" className="hover:text-white transition-colors">
            Site Guidelines
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms & Conditions
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/copyright" className="hover:text-white transition-colors">
            Copyright Compliance
          </Link>
          <Link href="/data-collection" className="hover:text-white transition-colors">
            Data Collection Notice
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact Us
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About Us
          </Link>
        </div>

        {/* Copyright Row */}
        <div className="mt-6 flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <span className="font-logo text-lg text-white" style={{ letterSpacing: '0.02em' }}>
              RateMyProf
            </span>
            <span className="text-sm">
              © {currentYear} All Rights Reserved
            </span>
          </div>
          
          {/* Legal Disclaimer */}
          <p className="text-xs text-gray-500 text-center max-w-4xl px-4 leading-relaxed">
            RateMyProf India is an intermediary under Section 79 of the Information Technology Act, 2000. User-generated content does not represent our views.
          </p>
        </div>
      </div>
    </footer>
  )
}
