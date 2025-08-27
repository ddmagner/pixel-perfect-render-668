import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/settings');
  };

  return (
    <div
      className="flex w-full max-w-sm mx-auto flex-col items-start relative bg-white overflow-x-hidden min-h-screen"
      style={{ fontFamily: 'Gilroy, sans-serif' }}
    >
      {/* Navigation with back button */}
      <nav className="flex justify-between items-center self-stretch px-2.5 pt-4 pb-1 bg-white">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-[#09121F]"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-[9px]">
          <div>
            <img 
              src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
              alt="Logo" 
              className="w-[14px] h-[14px]"
            />
          </div>
          <div className="w-[91px] self-stretch">
            <img 
              src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
              alt="TIME IN Logo" 
              className="h-[14px] w-[91px]"
            />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-2.5 py-4">
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8 mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-[#09121F] text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Information We Collect</h2>
            <p>Time In collects only the information necessary to provide our time tracking service:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Account information (email, name, profile details)</li>
              <li>Time entries and project data you create</li>
              <li>Device information for app functionality</li>
              <li>Usage analytics to improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
            <p>Your information is used exclusively to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide and maintain the Time In service</li>
              <li>Generate time cards and invoices</li>
              <li>Sync data across your devices</li>
              <li>Improve app performance and features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Data Storage and Security</h2>
            <p>Your data is stored securely using industry-standard encryption. We use Supabase for data storage, which provides enterprise-grade security and compliance. All data transmission is encrypted using SSL/TLS.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Data Sharing</h2>
            <p>We do not sell, trade, or share your personal information with third parties, except:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>When required by law</li>
              <li>To protect our rights or safety</li>
              <li>With service providers who assist in app operation (under strict confidentiality)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access and export your data at any time</li>
              <li>Delete your account and associated data</li>
              <li>Correct inaccurate information</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Data Retention</h2>
            <p>We retain your data only as long as necessary to provide our services. Deleted accounts and data are permanently removed within 30 days of deletion request.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Cookies and Tracking</h2>
            <p>Time In uses minimal essential cookies for authentication and app functionality. We do not use third-party tracking cookies or advertising networks.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Children's Privacy</h2>
            <p>Time In is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Changes to Privacy Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us through the app's support channels.</p>
          </section>

          <p className="text-xs text-[#BFBFBF] mt-8">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
        
      {/* Close Button */}
      <div className="w-full px-2.5 py-5">
        <button
          onClick={handleBack}
          className="w-full text-white py-3.5 font-bold text-sm transition-colors"
          style={{
            backgroundColor: '#09121F'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;