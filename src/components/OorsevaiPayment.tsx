import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  Smartphone, 
  ShieldCheck, 
  Receipt, 
  ArrowRight, 
  X,
  Lock,
  Building2,
  Check
} from "lucide-react";
import { OorsevaiPaymentTxn } from "../types";

// ==========================================
// LOCAL STORAGE & TRIAL HELPER UTILITIES
// ==========================================

export function getRegistrationDate(): Date {
  if (typeof window === "undefined") return new Date();
  let saved = localStorage.getItem("oorsevai_reg_date");
  if (!saved) {
    saved = new Date().toISOString();
    localStorage.setItem("oorsevai_reg_date", saved);
  }
  return new Date(saved);
}

export function getTrialInfo() {
  if (typeof window === "undefined") {
    return { daysElapsed: 0, daysRemaining: 10, isFreeTrialActive: true, isOverridden: false };
  }

  const override = localStorage.getItem("oorsevai_trial_override"); // "active" | "expired" | null
  if (override === "expired") {
    return { daysElapsed: 12, daysRemaining: 0, isFreeTrialActive: false, isOverridden: true };
  }
  if (override === "active") {
    return { daysElapsed: 2, daysRemaining: 8, isFreeTrialActive: true, isOverridden: true };
  }

  const regDate = getRegistrationDate();
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - regDate.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 10 - daysElapsed);
  const isFreeTrialActive = daysRemaining > 0;

  return { daysElapsed, daysRemaining, isFreeTrialActive, isOverridden: false };
}

export function setTrialOverride(mode: "active" | "expired" | null) {
  if (typeof window === "undefined") return;
  if (mode === null) {
    localStorage.removeItem("oorsevai_trial_override");
  } else {
    localStorage.setItem("oorsevai_trial_override", mode);
  }
  window.dispatchEvent(new Event("storage"));
}

export function getPaymentHistory(): OorsevaiPaymentTxn[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("oorsevai_payment_history");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function recordPaymentTxn(txn: OorsevaiPaymentTxn) {
  if (typeof window === "undefined") return;
  const history = getPaymentHistory();
  const updated = [txn, ...history];
  localStorage.setItem("oorsevai_payment_history", JSON.stringify(updated));
  window.dispatchEvent(new Event("storage"));
}

// ==========================================
// 1. SLICK & CLEAN PRICING BANNER
// ==========================================

interface PricingBannerProps {
  language?: "en" | "ta";
  role?: "customer" | "owner" | "labor" | "admin";
  onOpenLedger?: () => void;
}

export const OorsevaiPricingBanner: React.FC<PricingBannerProps> = ({
  language = "en",
  onOpenLedger
}) => {
  const [trialInfo, setTrialInfo] = useState(getTrialInfo());

  useEffect(() => {
    const handleStorage = () => setTrialInfo(getTrialInfo());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#172B10] via-[#243F1A] to-[#36572A] text-white p-3.5 rounded-2xl border border-amber-400/30 shadow-xs flex items-center justify-between gap-3">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center space-x-3 z-10">
        {/* Big Bold FREE Badge Icon */}
        <div className="w-11 h-11 rounded-xl bg-amber-400 text-[#172B10] flex flex-col items-center justify-center shrink-0 shadow-xs border border-amber-300 leading-tight">
          <span className="text-[8px] uppercase font-black tracking-tighter">10 DAYS</span>
          <span className="text-xs font-black">FREE</span>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-black text-white tracking-tight">
              {language === "ta" ? "முதல் 10 நாட்கள் 100% இலவசம்" : "First 10 Days 100% Free"}
            </span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-bold px-2 py-0.5 rounded-full">
              {language === "ta" ? "பிறகு சேவைக்கு ₹1" : "Then ₹1 / service"}
            </span>
          </div>

          <p className="text-[11px] text-emerald-100/80 font-medium">
            {language === "ta"
              ? "முன்பதிவு முடிவில் GPay, PhonePe அல்லது Card மூலம் செலுத்துங்கள்."
              : "Pay Re 1 at booking completion via GPay, PhonePe, or Card after trial."}
          </p>
        </div>
      </div>

      {onOpenLedger && (
        <button
          onClick={onOpenLedger}
          className="z-10 bg-amber-400 hover:bg-amber-300 text-[#172B10] text-[10px] font-black px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shadow-xs flex items-center space-x-1.5 shrink-0"
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>{language === "ta" ? "வரலாறு" : "Ledger"}</span>
        </button>
      )}
    </div>
  );
};

// ==========================================
// 2. PAYMENT GATEWAY MODAL AT BOOKING END
// ==========================================

interface PaymentModalProps {
  role: "customer" | "owner" | "labor";
  serviceName: string;
  bookingId?: string;
  baseAmount?: number;
  language?: "en" | "ta";
  onSuccess: (txn: OorsevaiPaymentTxn) => void;
  onCancel: () => void;
}

export const OorsevaiPaymentModal: React.FC<PaymentModalProps> = ({
  role,
  serviceName,
  bookingId,
  baseAmount = 0,
  language = "en",
  onSuccess,
  onCancel
}) => {
  const trialInfo = getTrialInfo();
  const serviceFee = trialInfo.isFreeTrialActive ? 0 : 1;
  const totalCharge = baseAmount + serviceFee;

  const [paymentMethod, setPaymentMethod] = useState<"gpay" | "upi" | "card" | "netbanking">("gpay");
  const [upiId, setUpiId] = useState("farmer@okaxis");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("888");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedTxn, setCompletedTxn] = useState<OorsevaiPaymentTxn | null>(null);

  const roleLabel =
    role === "customer" ? (language === "ta" ? "வாடிக்கையாளர் முன்பதிவு" : "Customer Booking Checkout") :
    role === "owner" ? (language === "ta" ? "இயந்திர விநியோக சேவைக் கட்டணம்" : "Owner Dispatch Confirmation") :
    (language === "ta" ? "தொழிலாளர் பணி ஏற்புக் கட்டணம்" : "Worker Shift Acceptance");

  const handlePay = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const txn: OorsevaiPaymentTxn = {
        id: `TXN_OOR_${Math.floor(100000 + Math.random() * 900000)}`,
        bookingId: bookingId || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
        role,
        serviceName,
        amount: serviceFee,
        isTrial: trialInfo.isFreeTrialActive,
        paymentMethod: trialInfo.isFreeTrialActive ? "trial_waiver" : paymentMethod,
        paymentDetails: trialInfo.isFreeTrialActive 
          ? "10-Day Free Trial Waiver (₹1 Waived)" 
          : paymentMethod === "gpay" ? `Google Pay (${upiId})` 
          : paymentMethod === "upi" ? `UPI Payment (${upiId})`
          : `Card ending in ${cardNumber.slice(-4)}`,
        status: "success",
        timestamp: new Date().toISOString()
      };

      recordPaymentTxn(txn);
      setCompletedTxn(txn);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleFinish = () => {
    if (completedTxn) {
      onSuccess(completedTxn);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-[#E8E6E1] dark:border-slate-800 rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl space-y-0 text-[#2D2D2A] dark:text-slate-100">
        
        {/* Gateway Header */}
        <div className="bg-[#1E3316] text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-tight">
                {language === "ta" ? "ஊர்சேவை கட்டண நுழைவாயில்" : "Oorsevai Payment Gateway"}
              </h3>
              <p className="text-[10px] text-emerald-200 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Gateway Content */}
        {!isSuccess ? (
          <div className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto text-xs">
            
            {/* Booking Summary Card */}
            <div className="bg-[#FAF7F2] dark:bg-slate-800/50 p-3.5 rounded-2xl border border-[#E8E6E1] dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-[#8A867E]">
                <span>{language === "ta" ? "சேவை:" : "Service Details:"}</span>
                <span className="font-mono font-bold">{bookingId || "NEW_BOOKING"}</span>
              </div>
              <p className="font-extrabold text-sm text-[#2D2D2A] dark:text-white">{serviceName}</p>

              <div className="pt-2 border-t border-[#E8E6E1] dark:border-slate-700 space-y-1">
                {baseAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#8A867E]">{language === "ta" ? "சேவை தொகை:" : "Service Amount:"}</span>
                    <span className="font-bold">₹{baseAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[#8A867E]">
                    {language === "ta" ? "ஊர்சேவை தள கட்டணம்:" : "Oorsevai Platform Fee:"}
                  </span>
                  {trialInfo.isFreeTrialActive ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <span className="line-through text-slate-400 text-[10px]">₹1.00</span>
                      <span>₹0.00 (10 Days Free)</span>
                    </span>
                  ) : (
                    <span className="text-[#3E5C31] dark:text-emerald-400 font-extrabold">₹1.00 (Re 1)</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-1 text-sm font-black text-[#2D2D2A] dark:text-white border-t border-slate-200 dark:border-slate-700">
                  <span>{language === "ta" ? "மொத்த செலுத்தல்:" : "Total Payable:"}</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    ₹{totalCharge > 0 ? totalCharge.toLocaleString() : "0 (Free Trial)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Trial Status Reminder */}
            {trialInfo.isFreeTrialActive && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl flex items-center space-x-2 text-[10px] text-emerald-900 dark:text-emerald-200">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{language === "ta" ? "🎉 10 நாட்கள் இலவச சலுகை!" : "🎉 10-Day Free Trial Offer Active!"}</strong> Re 1 platform fee is 100% waived.
                </span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-[#8A867E]">
                {language === "ta" ? "கட்டண முறை தேர்ந்தெடு:" : "Select Payment Gateway Option:"}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("gpay")}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                    paymentMethod === "gpay"
                      ? "border-[#3E5C31] bg-[#3E5C31]/10 ring-2 ring-[#3E5C31]/20 font-bold"
                      : "border-[#E8E6E1] dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-800/40"
                  }`}
                >
                  <Smartphone className="h-4 w-4 text-[#3E5C31] shrink-0" />
                  <div>
                    <span className="text-xs block font-extrabold leading-tight">Google Pay</span>
                    <span className="text-[8px] text-[#8A867E]">GPay / BHIM UPI</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                    paymentMethod === "upi"
                      ? "border-[#3E5C31] bg-[#3E5C31]/10 ring-2 ring-[#3E5C31]/20 font-bold"
                      : "border-[#E8E6E1] dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-800/40"
                  }`}
                >
                  <Zap className="h-4 w-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-xs block font-extrabold leading-tight">PhonePe / UPI</span>
                    <span className="text-[8px] text-[#8A867E]">Paytm VPA</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-[#3E5C31] bg-[#3E5C31]/10 ring-2 ring-[#3E5C31]/20 font-bold"
                      : "border-[#E8E6E1] dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-800/40"
                  }`}
                >
                  <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-xs block font-extrabold leading-tight">Credit/Debit Card</span>
                    <span className="text-[8px] text-[#8A867E]">Visa / MasterCard</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("netbanking")}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                    paymentMethod === "netbanking"
                      ? "border-[#3E5C31] bg-[#3E5C31]/10 ring-2 ring-[#3E5C31]/20 font-bold"
                      : "border-[#E8E6E1] dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-800/40"
                  }`}
                >
                  <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs block font-extrabold leading-tight">Net Banking</span>
                    <span className="text-[8px] text-[#8A867E]">SBI / HDFC / ICICI</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Selected Method Details Input */}
            {(paymentMethod === "gpay" || paymentMethod === "upi") && (
              <div className="bg-[#FAF7F2] dark:bg-slate-800/40 p-2.5 rounded-xl border border-[#E8E6E1] dark:border-slate-800 space-y-1">
                <label className="block text-[9px] font-bold text-[#8A867E]">UPI VPA Address:</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-[#E8E6E1] dark:border-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#3E5C31]"
                  />
                  <button
                    type="button"
                    onClick={() => setUpiId("9876543210@ybl")}
                    className="text-[9px] font-bold bg-[#3E5C31]/10 text-[#3E5C31] px-2 py-1 rounded-lg"
                  >
                    Sample
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="bg-[#FAF7F2] dark:bg-slate-800/40 p-2.5 rounded-xl border border-[#E8E6E1] dark:border-slate-800 space-y-2 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-[#8A867E]">Card Number:</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-[#E8E6E1] dark:border-slate-700 px-2.5 py-1 rounded-lg font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-[#8A867E]">Expiry:</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-[#E8E6E1] dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#8A867E]">CVV:</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      maxLength={3}
                      className="w-full bg-white dark:bg-slate-900 border border-[#E8E6E1] dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pay Action Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePay}
              className="w-full bg-[#1E3316] hover:bg-[#2D4622] text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-300" />
                  <span>
                    {trialInfo.isFreeTrialActive
                      ? `Confirm & Complete Booking (₹0 Free)`
                      : `Pay ₹${totalCharge > 0 ? totalCharge : 1} & Confirm Booking`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-[9px] text-[#8A867E]">
              🔒 Encrypted 256-bit Payment Protection Guarantee
            </p>
          </div>
        ) : (
          /* Payment Success Confirmation */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 rounded-full border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                {language === "ta" ? "பரிவர்த்தனை வெற்றி!" : "PAYMENT SUCCESSFUL!"}
              </span>
              <h3 className="text-base font-black text-[#2D2D2A] dark:text-white mt-1">
                {language === "ta" ? "முன்பதிவு வெற்றிகரமாக முடிந்தது!" : "Booking Payment Confirmed!"}
              </h3>
              <p className="text-xs text-[#8A867E] mt-0.5">
                {completedTxn?.isTrial 
                  ? "10-Day Free Trial waiver applied (Re 1 platform fee waived)." 
                  : `₹${serviceFee}.00 platform fee paid via ${paymentMethod.toUpperCase()}.`}
              </p>
            </div>

            <div className="bg-[#FAF7F2] dark:bg-slate-800/50 p-3 rounded-xl border border-[#E8E6E1] dark:border-slate-800 text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-[#8A867E]">Transaction ID:</span>
                <span className="font-mono font-bold text-[#2D2D2A] dark:text-white">{completedTxn?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A867E]">Service:</span>
                <span className="font-bold truncate max-w-[180px]">{completedTxn?.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A867E]">Amount Paid:</span>
                <span className="font-extrabold text-[#3E5C31] dark:text-emerald-400">
                  {completedTxn?.isTrial ? "₹0.00 (Free Trial)" : `₹${completedTxn?.amount}.00`}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-[#3E5C31] hover:bg-[#2D4622] text-white font-black text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              {language === "ta" ? "முடிந்தது 👍" : "Done 👍"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. PAYMENT LEDGER & HISTORY HUB
// ==========================================

interface LedgerViewProps {
  language?: "en" | "ta";
  role?: "customer" | "owner" | "labor" | "admin";
}

export const OorsevaiLedgerView: React.FC<LedgerViewProps> = ({ language = "en" }) => {
  const [trialInfo, setTrialInfo] = useState(getTrialInfo());
  const [history, setHistory] = useState<OorsevaiPaymentTxn[]>(getPaymentHistory());

  useEffect(() => {
    const handleStorage = () => {
      setTrialInfo(getTrialInfo());
      setHistory(getPaymentHistory());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const totalPaid = history.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-3">
      <OorsevaiPricingBanner language={language} />

      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-[#E8E6E1] dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E1] dark:border-slate-800">
          <h3 className="font-extrabold text-xs text-[#2D2D2A] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="h-4 w-4 text-[#3E5C31]" />
            {language === "ta" ? "கட்டண பதிவு மற்றும் வரலாறு" : "Service Payment Ledger"}
          </h3>
          <span className="text-[10px] text-[#8A867E]">
            {language === "ta" ? "பதிவு:" : "Reg Date:"} {getRegistrationDate().toLocaleDateString()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#FAF7F2] dark:bg-slate-800/40 p-2.5 rounded-xl border border-[#E8E6E1] dark:border-slate-800">
            <span className="text-[9px] font-bold text-[#8A867E] uppercase block">{language === "ta" ? "இலவச நாட்கள்" : "Free Days Left"}</span>
            <span className="text-base font-black text-[#3E5C31] dark:text-emerald-400">{trialInfo.daysRemaining} Days</span>
          </div>

          <div className="bg-[#FAF7F2] dark:bg-slate-800/40 p-2.5 rounded-xl border border-[#E8E6E1] dark:border-slate-800">
            <span className="text-[9px] font-bold text-[#8A867E] uppercase block">{language === "ta" ? "சேவைகள்" : "Services Used"}</span>
            <span className="text-base font-black text-[#2D2D2A] dark:text-white">{history.length}</span>
          </div>

          <div className="bg-[#FAF7F2] dark:bg-slate-800/40 p-2.5 rounded-xl border border-[#E8E6E1] dark:border-slate-800">
            <span className="text-[9px] font-bold text-[#8A867E] uppercase block">{language === "ta" ? "மொத்தம் செலுத்தியது" : "Total Fees Paid"}</span>
            <span className="text-base font-black text-amber-600">₹{totalPaid}</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <h4 className="font-bold text-xs text-[#2D2D2A] dark:text-white">
            {language === "ta" ? "கட்டண ரசீதுகள்" : "Recent Receipts"} ({history.length})
          </h4>

          {history.length === 0 ? (
            <div className="p-3 text-center text-xs text-[#8A867E] bg-[#FAF7F2] dark:bg-slate-800/30 rounded-xl border border-dashed border-[#E8E6E1] dark:border-slate-800">
              No transactions recorded yet. Your first 10 days are 100% free!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.map((txn) => (
                <div
                  key={txn.id}
                  className="p-2.5 rounded-xl border border-[#E8E6E1] dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-800/40 flex justify-between items-center text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-[#2D2D2A] dark:text-white">{txn.serviceName}</span>
                      {txn.isTrial && (
                        <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8A867E]">{txn.id} • {txn.paymentDetails || txn.paymentMethod}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-xs text-[#3E5C31] dark:text-emerald-400 block">
                      {txn.amount === 0 ? "₹0 (Free)" : `₹${txn.amount}`}
                    </span>
                    <span className="text-[8px] text-[#8A867E]">
                      {new Date(txn.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
