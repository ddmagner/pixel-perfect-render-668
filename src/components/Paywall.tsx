import React, { useEffect, useState } from 'react';
import { X, Check, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useSubscription } from '@/context/SubscriptionContext';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
}

// Product IDs configured in RevenueCat
const PRODUCTS = {
  monthly: 'premium_monthly',
  yearly: 'premium_yearly',
} as const;

const FEATURES = [
  'Unlimited time entries',
  'Export to PDF & Excel',
  'Invoice generation',
  'Client management',
  'Advanced reporting',
  'Priority support',
];

export function Paywall({ isOpen, onClose }: PaywallProps) {
  const { user } = useAuth();
  const { purchase, isPurchasing, purchaseSuccess, isDespiaNative, reset } = useRevenueCat();
  const { refetch, isPremium } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [pollingCount, setPollingCount] = useState(0);

  // Poll for subscription status after successful purchase
  useEffect(() => {
    if (purchaseSuccess && pollingCount < 10) {
      const timer = setTimeout(() => {
        refetch();
        setPollingCount(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [purchaseSuccess, pollingCount, refetch]);

  // Close paywall if user becomes premium
  useEffect(() => {
    if (isPremium && isOpen) {
      onClose();
      reset();
      setPollingCount(0);
    }
  }, [isPremium, isOpen, onClose, reset]);

  const handlePurchase = () => {
    if (!user) return;
    const productId = PRODUCTS[selectedPlan];
    purchase(user.id, productId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="relative w-full max-w-sm mx-4 bg-white rounded-2xl overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 40px)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-foreground" />
        </button>

        {/* Header */}
        <div className="bg-primary text-primary-foreground px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-primary-foreground/80 text-sm">
            Unlock all features and supercharge your time tracking
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          {/* Features */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              What's included
            </h3>
            <ul className="space-y-3">
              {FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plan Selection */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                selectedPlan === 'yearly'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="absolute -top-2 right-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                Save 40%
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-foreground">Yearly</div>
                  <div className="text-sm text-muted-foreground">Billed annually</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-foreground">$4.99</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedPlan === 'monthly'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-foreground">Monthly</div>
                  <div className="text-sm text-muted-foreground">Billed monthly</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-foreground">$7.99</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 border-t border-border">
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || !isDespiaNative}
            className="w-full py-4 bg-primary text-primary-foreground font-bold text-base rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPurchasing ? (
              'Processing...'
            ) : purchaseSuccess ? (
              <>
                <Check size={20} />
                Verifying purchase...
              </>
            ) : !isDespiaNative ? (
              'Available in native app'
            ) : (
              <>
                <Zap size={20} />
                Subscribe Now
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Cancel anytime. Subscription renews automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
