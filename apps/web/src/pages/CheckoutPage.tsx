import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart, CartItem } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const { user, role, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Multi-step: 1 = Delivery, 2 = Review, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Delivery Form State
  const [shippingData, setShippingData] = useState({
    shipping_name: user?.name || 'Rohan Sharma',
    shipping_phone: '+91 9876543210',
    shipping_address: 'Flat 402, Skyline Residency, Outer Ring Road',
    shipping_city: 'Bengaluru',
    shipping_state: 'Karnataka',
    shipping_postal: '560103',
  });

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'UPI' | 'COD'>('CREDIT_CARD');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242 4242 4242 4242',
    nameOnCard: user?.name || 'Rohan Sharma',
    expiry: '12/28',
    cvv: '123',
  });
  const [upiId, setUpiId] = useState('rohan@okaxis');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (role === 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Admin Checkout Restricted</h2>
          <p className="text-xs text-slate-500">
            Administrators manage store inventory and delivery pipelines and are restricted from placing personal orders.
          </p>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-purple-900">
            Switch to a Customer account to test the complete checkout & payment simulation:
          </p>
          <button
            onClick={() => demoLogin('CUSTOMER')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" /> 1-Click Fast Login as Customer
          </button>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Storefront
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Add products before accessing checkout.</p>
        <Link
          to="/products"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !shippingData.shipping_name ||
      !shippingData.shipping_phone ||
      !shippingData.shipping_address ||
      !shippingData.shipping_city ||
      !shippingData.shipping_state ||
      !shippingData.shipping_postal
    ) {
      setErrorMessage('Please fill in all shipping fields.');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...shippingData,
        payment_method: paymentMethod,
        payment_details:
          paymentMethod === 'CREDIT_CARD'
            ? cardDetails
            : paymentMethod === 'UPI'
            ? { upiId }
            : {},
      };

      const res = await api.post('/orders/checkout', payload);

      if (res.data?.success && res.data?.order) {
        await refreshCart();
        navigate(`/orders/confirmation/${res.data.order.order_number}`, {
          state: { order: res.data.order },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment simulation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Checkout Stepper */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto relative">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-1">Delivery</span>
          </div>

          <div
            className={`flex-1 h-0.5 mx-4 ${
              currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          />

          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-1">Review</span>
          </div>

          <div
            className={`flex-1 h-0.5 mx-4 ${
              currentStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          />

          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-1">Payment</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Transaction / Validation Alert</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Delivery Information */}
      {currentStep === 1 && (
        <form
          onSubmit={handleDeliverySubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 1: Delivery Address</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your shipping destination details
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={shippingData.shipping_name}
                onChange={(e) =>
                  setShippingData({ ...shippingData, shipping_name: e.target.value })
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
              <input
                type="tel"
                required
                value={shippingData.shipping_phone}
                onChange={(e) =>
                  setShippingData({ ...shippingData, shipping_phone: e.target.value })
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Street Address *</label>
              <input
                type="text"
                required
                value={shippingData.shipping_address}
                onChange={(e) =>
                  setShippingData({ ...shippingData, shipping_address: e.target.value })
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">City *</label>
              <input
                type="text"
                required
                value={shippingData.shipping_city}
                onChange={(e) =>
                  setShippingData({ ...shippingData, shipping_city: e.target.value })
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">State *</label>
              <input
                type="text"
                required
                value={shippingData.shipping_state}
                onChange={(e) =>
                  setShippingData({ ...shippingData, shipping_state: e.target.value })
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Postal Code (PIN) *</label>
              <input
                type="text"
                required
                value={shippingData.shipping_postal}
                onChange={(e) =>
                  setShippingData({ ...shippingData, shipping_postal: e.target.value })
                }
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
            >
              Continue to Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Order Review */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Step 2: Review Order Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify items, pricing, and destination before payment
            </p>
          </div>

          {/* Shipping Summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Shipping To:</span>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Edit Address
              </button>
            </div>
            <p className="text-slate-700 font-medium">
              {shippingData.shipping_name} ({shippingData.shipping_phone})
            </p>
            <p className="text-slate-500">
              {shippingData.shipping_address}, {shippingData.shipping_city},{' '}
              {shippingData.shipping_state} - {shippingData.shipping_postal}
            </p>
          </div>

          {/* Items breakdown */}
          <div className="divide-y divide-slate-100">
            {cart.items.map((item: CartItem) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={
                        item.product.image ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'
                      }
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.product.name}</h4>
                    <p className="text-slate-400">
                      Qty: {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  ₹{item.itemTotal.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">
                ₹{cart.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              <span className="font-semibold text-slate-900">
                {cart.shipping_fee === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  `₹${cart.shipping_fee}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Payable</span>
              <span className="text-indigo-600 font-extrabold text-base">
                ₹{cart.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
            >
              Proceed to Payment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Fake Payment Simulation */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 3: Simulated Payment Gateway
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Test checkout transactions in a safe sandbox simulation
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              <Lock className="w-3.5 h-3.5" /> 100% Sandbox Simulation
            </span>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('CREDIT_CARD')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                paymentMethod === 'CREDIT_CARD'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="text-xs">Fake Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                paymentMethod === 'UPI'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <QrCode className="w-5 h-5 text-purple-600" />
              <span className="text-xs">UPI Simulation</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('COD')}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                paymentMethod === 'COD'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Truck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs">Cash on Delivery</span>
            </button>
          </div>

          {/* Credit Card Inputs with Quick Preset Buttons */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Test Card Presets:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCardDetails({
                        cardNumber: '4242 4242 4242 4242',
                        nameOnCard: 'Rohan Sharma',
                        expiry: '12/28',
                        cvv: '123',
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-semibold transition"
                  >
                    ✓ Fill Success Card
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCardDetails({
                        cardNumber: '4000 0000 0000 0000',
                        nameOnCard: 'Test Declined',
                        expiry: '12/28',
                        cvv: '000',
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-semibold transition"
                  >
                    ✕ Fill Fail Card
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardDetails.cardNumber}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cardNumber: e.target.value })
                    }
                    className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardDetails.expiry}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, expiry: e.target.value })
                      }
                      className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardDetails.cvv}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, cvv: e.target.value })
                      }
                      className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UPI Simulation */}
          {paymentMethod === 'UPI' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">UPI Presets:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUpiId('rohan@okaxis')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-semibold transition"
                  >
                    ✓ Success UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiId('fail@upi')}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-semibold transition"
                  >
                    ✕ Fail UPI
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Cash on Delivery Notice */}
          {paymentMethod === 'COD' && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Pay with Cash on Delivery
              </p>
              <p className="text-emerald-700">
                You will pay ₹{cart.total.toLocaleString('en-IN')} in cash when our courier partner delivers your package.
              </p>
            </div>
          )}

          {/* Checkout Final Trigger */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={isProcessing}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Review
            </button>

            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold rounded-xl shadow-xl shadow-indigo-500/20 hover:scale-102 active:scale-98 transition flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Transaction...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{cart.total.toLocaleString('en-IN')} & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
