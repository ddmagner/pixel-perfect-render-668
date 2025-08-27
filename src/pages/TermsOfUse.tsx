import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const TermsOfUsePage = () => {
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
        <h1 className="text-[#09121F] text-[28px] font-bold leading-8 mb-6">Terms of Use</h1>
        
        <div className="space-y-6 text-[#09121F] text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing and using Time In, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Use License</h2>
            <p>Permission is granted to temporarily use Time In for personal and commercial time tracking purposes. This license shall automatically terminate if you violate any of these restrictions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. User Data</h2>
            <p>You retain full ownership of your time tracking data. Time In provides tools to export your data at any time. We do not claim ownership of your personal or business information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Service Availability</h2>
            <p>While we strive to maintain 99.9% uptime, Time In is provided "as is" without any guarantees of availability or performance. We reserve the right to modify or discontinue the service at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. User Responsibilities</h2>
            <p>Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account. You agree to notify us immediately of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Prohibited Uses</h2>
            <p>You may not use Time In for any unlawful purpose or to solicit others to perform unlawful acts. You may not transmit any malicious code or attempt to disrupt the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Limitation of Liability</h2>
            <p>In no event shall Time In be liable for any damages arising out of the use or inability to use the service, including but not limited to lost profits or data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the service constitutes acceptance of the modified terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Contact Information</h2>
            <p>If you have any questions about these Terms of Use, please contact us through the app's support channels.</p>
          </section>
        </div>
      </div>
        
      {/* Close Button */}
      <div className="px-2.5 py-6">
        <button
          onClick={handleBack}
          className="w-full bg-[#09121F] text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TermsOfUsePage;