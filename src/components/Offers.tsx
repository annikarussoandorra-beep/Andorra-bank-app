import React from 'react';
import { Home, CreditCard, Car, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';

interface OffersProps {
  user: UserProfile;
  language: Language;
}

export default function Offers({ user, language }: OffersProps) {
  const t = translations[language];

  const handleApply = () => {
    if (!user.isActivated) {
      alert(t.account_not_activated_alert || t.onboarding_3_desc);
      return;
    }
    alert(t.contact_manager_alert || t.get_started);
  };

  const offers = [
    {
      id: 'mortgage',
      icon: <Home className="text-red-600" size={32} />,
      title: t.mortgage_title,
      amount: t.mortgage_amount,
      description: t.mortgage_desc,
      features: [t.mortgage_feature_1, t.mortgage_feature_2, t.mortgage_feature_3],
      bg: 'bg-red-50',
      border: 'border-red-100'
    },
    {
      id: 'credit-card',
      icon: <CreditCard className="text-blue-600" size={32} />,
      title: t.credit_card_title,
      amount: t.credit_card_amount,
      description: t.credit_card_desc,
      features: [t.credit_card_feature_1, t.credit_card_feature_2, t.credit_card_feature_3],
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      id: 'personal-loan',
      icon: <Car className="text-green-600" size={32} />,
      title: t.loan_title,
      amount: t.loan_amount,
      description: t.loan_desc,
      features: [t.loan_feature_1, t.loan_feature_2, t.loan_feature_3],
      bg: 'bg-green-50',
      border: 'border-green-100'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-[#FF0000] to-red-800 rounded-3xl p-8 lg:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <Star size={16} className="text-yellow-300 fill-yellow-300" />
            {t.only_for_active}
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight">
            {t.offers_title}
          </h1>
          <p className="text-red-100 text-lg lg:text-xl">
            {t.offers_desc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {offers.map((offer) => (
          <div key={offer.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className={`p-8 ${offer.bg} border-b ${offer.border} flex flex-col items-center text-center relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                {React.cloneElement(offer.icon as React.ReactElement<any>, { size: 120 })}
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 relative z-10">
                {offer.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">{offer.title}</h3>
              <div className="text-2xl font-black text-[#FF0000] relative z-10">{offer.amount}</div>
            </div>
            
            <div className="p-8">
              <p className="text-gray-600 mb-8 text-center h-16">
                {offer.description}
              </p>
              
              <div className="space-y-4 mb-8">
                {offer.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="text-[#FF0000] shrink-0 mt-0.5" size={18} />
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={handleApply}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-[#FF0000] transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-[#FF0000]/20"
              >
                {language === 'ru' ? 'Оформить заявку' : t.apply_now}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
