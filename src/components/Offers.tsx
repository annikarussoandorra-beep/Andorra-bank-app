import React from 'react';
import { Home, CreditCard, Car, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { Language, UserProfile } from '../types';

interface OffersProps {
  user: UserProfile;
  language: Language;
}

export default function Offers({ user, language }: OffersProps) {
  const isRu = language === 'ru';

  const handleApply = () => {
    if (!user.isActivated) {
      alert(isRu 
        ? 'Ваш счет не активирован. Пожалуйста, активируйте счет, чтобы получить доступ к предложениям.' 
        : 'Your account is not activated. Please activate your account to access these offers.');
      return;
    }
    alert(isRu ? 'Свяжитесь с вашим персональным менеджером для оформления заявки.' : 'Contact your personal manager to apply.');
  };

  const offers = [
    {
      id: 'mortgage',
      icon: <Home className="text-red-600" size={32} />,
      title: isRu ? 'Льготная ипотека' : 'Preferential Mortgage',
      amount: isRu ? 'до 1 200 000 €' : 'up to 1,200,000 €',
      description: isRu 
        ? 'Эксклюзивные условия для активных клиентов. Минимальная процентная ставка и гибкий график платежей.'
        : 'Exclusive conditions for active clients. Minimal interest rate and flexible payment schedule.',
      features: isRu 
        ? ['Ставка от 1.1% годовых', 'Без первоначального взноса', 'Одобрение за 1 час']
        : ['Rate from 1.1% APR', 'Zero down payment', '1-hour approval'],
      bg: 'bg-red-50',
      border: 'border-red-100'
    },
    {
      id: 'credit-card',
      icon: <CreditCard className="text-blue-600" size={32} />,
      title: isRu ? 'Премиальная кредитная карта' : 'Premium Credit Card',
      amount: isRu ? 'лимит до 100 000 €' : 'limit up to 100,000 €',
      description: isRu
        ? 'Статусная карта с уникальными привилегиями, кэшбэком и бесплатным обслуживанием.'
        : 'Status card with unique privileges, cashback, and free maintenance.',
      features: isRu
        ? ['1.75% на все покупки до 365 дней', 'Снижение до 0.7% при объеме торгов >10 000 €', 'Доступ в бизнес-залы']
        : ['1.75% on all purchases up to 365 days', 'Reduction to 0.7% with volume >10,000 €', 'Business lounge access'],
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      id: 'personal-loan',
      icon: <Car className="text-green-600" size={32} />,
      title: isRu ? 'Кредит' : 'Personal Loan',
      amount: isRu ? 'до 400 000 €' : 'up to 400,000 €',
      description: isRu
        ? 'На покупку автомобиля мечты или любые личные нужды.'
        : 'For buying your dream car or any personal needs.',
      features: isRu
        ? ['Ставка 1.7% годовых', 'Срок до 7 лет', 'Без залога и поручителей']
        : ['Interest rate 1.7% APR', 'Term up to 7 years', 'No collateral or guarantors'],
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
            {isRu ? 'Только для активных клиентов' : 'Only for active clients'}
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight">
            {isRu ? 'Специальные предложения банка' : 'Special Bank Offers'}
          </h1>
          <p className="text-red-100 text-lg lg:text-xl">
            {isRu 
              ? 'Мы ценим вашу активность и подготовили эксклюзивные финансовые продукты с беспрецедентными условиями.' 
              : 'We value your activity and have prepared exclusive financial products with unprecedented conditions.'}
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
                {isRu ? 'Оформить заявку' : 'Apply Now'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
