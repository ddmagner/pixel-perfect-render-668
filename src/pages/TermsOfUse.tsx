import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { HomeIndicator } from '@/components/HomeIndicator';

const TermsOfUsePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    navigate('/?tab=settings');
  };

  return (
    <div
      className="flex w-full max-w-sm mx-auto flex-col items-start relative bg-white overflow-x-hidden min-h-screen"
      style={{ fontFamily: 'Gilroy, sans-serif' }}
    >
      {/* Navigation with back button */}
      <nav className="flex justify-center items-center self-stretch px-0 pt-4 pb-1 bg-white relative">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-[#09121F] absolute left-2.5"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex h-3.5 justify-end items-center">
          <div className="flex items-center gap-[9px]">
            <img 
              src="/time-in-logo.png" 
              alt="Time In Logo" 
              className="h-[14px]"
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
            <h2 className="text-lg font-semibold">7. Subscription Terms</h2>
            <p className="mb-2">Time In offers subscription plans that provide access to premium features. By subscribing, you agree to the following:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Free Trial:</strong> New users receive a 14-day free trial. You will not be charged during the trial period. If you do not cancel before the trial ends, your subscription will automatically begin.</li>
              <li><strong>Pricing:</strong> Subscriptions are available at $24.99/month or $199.99/year. Prices are subject to change with notice.</li>
              <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew at the end of each billing period unless canceled at least 24 hours before the renewal date. Your payment method will be charged automatically.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Cancellation Policy</h2>
            <p className="mb-2">You may cancel your subscription at any time through your device's subscription management:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>iOS:</strong> Go to Settings → [Your Name] → Subscriptions → Time In → Cancel Subscription</li>
              <li><strong>Android:</strong> Go to Google Play Store → Menu → Subscriptions → Time In → Cancel Subscription</li>
            </ul>
            <p className="mt-2">Cancellation takes effect at the end of your current billing period. You will retain access to premium features until then.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Refund Policy</h2>
            <p className="mb-2">Refunds are processed according to the policies of your app store:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Apple App Store:</strong> Refund requests must be submitted through Apple. Visit reportaproblem.apple.com to request a refund.</li>
              <li><strong>Google Play Store:</strong> Refund requests within 48 hours of purchase may be processed automatically. For later requests, contact Google Play support.</li>
            </ul>
            <p className="mt-2">Time In does not process refunds directly as all payments are handled through the respective app stores.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Limitation of Liability</h2>
            <p>In no event shall Time In be liable for any damages arising out of the use or inability to use the service, including but not limited to lost profits or data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">11. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the service constitutes acceptance of the modified terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">12. Contact Information</h2>
            <p>If you have any questions about these Terms of Use, please contact us through the app's support channels.</p>
          </section>
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
      
      <HomeIndicator />
    </div>
  );
};

export default TermsOfUsePage;