import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 md:px-8 max-w-4xl mx-auto py-12"
    >
      <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight mb-8">Privacy Policy</h1>
      <div className="space-y-6 text-slate-600">
        <p><strong>Last Updated:</strong> July 10, 2026</p>
        <p>Welcome to <strong>আহরোণ (Aharon)</strong>. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website.</p>
        
        <h2 className="text-2xl font-bold text-slate-900">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Full Name</li>
          <li>Email Address</li>
          <li>Phone Number</li>
          <li>Company Name (if applicable)</li>
          <li>Any information you voluntarily provide through our contact forms</li>
          <li>Technical information such as IP address, browser type, device information, and website usage data</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Respond to your inquiries</li>
          <li>Provide our services</li>
          <li>Improve our website and user experience</li>
          <li>Send important updates regarding our services</li>
          <li>Prevent fraud and maintain website security</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">3. Cookies</h2>
        <p>Our website may use cookies and similar technologies to improve your browsing experience, analyze website traffic, and remember your preferences. You can disable cookies through your browser settings, although some website features may not function properly.</p>

        <h2 className="text-2xl font-bold text-slate-900">4. Information Sharing</h2>
        <p>We do not sell or rent your personal information.</p>
        <p>We may share information only:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>When required by law</li>
          <li>With trusted service providers who help operate our website</li>
          <li>To protect our legal rights and website security</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">5. Data Security</h2>
        <p>We implement reasonable administrative, technical, and organizational measures to protect your personal information. However, no method of internet transmission or electronic storage is completely secure.</p>

        <h2 className="text-2xl font-bold text-slate-900">6. Third-Party Services</h2>
        <p>Our website may contain links to third-party websites or use third-party tools such as analytics or embedded content. We are not responsible for the privacy practices of those third-party services.</p>

        <h2 className="text-2xl font-bold text-slate-900">7. Your Rights</h2>
        <p>You may request to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Delete your personal information (where legally permitted)</li>
          <li>Withdraw consent for future communications</li>
        </ul>
        <p>To make a request, please contact us.</p>

        <h2 className="text-2xl font-bold text-slate-900">8. Children's Privacy</h2>
        <p>Our website is not intended for children under the age of 13, and we do not knowingly collect personal information from children.</p>

        <h2 className="text-2xl font-bold text-slate-900">9. Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated revision date.</p>

        <h2 className="text-2xl font-bold text-slate-900">10. Contact Us</h2>
        <p>If you have any questions regarding this Privacy Policy, please contact us:</p>
        <p><strong>আহরোণ</strong></p>
        <p>ফোন: <a href="tel:+8801796361024" className="text-primary hover:underline">+8801796361024</a></p>
        <p>Email: <a href="mailto:info@ahoroon.com" className="text-primary hover:underline">info@ahoroon.com</a></p>
        <p>Website: <a href="https://ahoroon.com" target="_blank" className="text-primary hover:underline">https://ahoroon.com</a></p>
      </div>
    </motion.div>
  );
}
