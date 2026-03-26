import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  Globe, 
  ShieldCheck, 
  TrendingUp, 
  Lock, 
  Bot, 
  CreditCard 
} from 'lucide-react';
import { Language, translations } from '../translations';
import { cn } from '../lib/utils';

interface OnboardingProps {
  onComplete: (language: Language) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'language' | 'tutorial'>('language');
  const [language, setLanguage] = useState<Language>('en');
  const [cardIndex, setCardIndex] = useState(0);

  const t = translations[language];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  const tutorialCards = [
    {
      title: t.onboarding_1_title,
      description: t.onboarding_1_desc,
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: t.onboarding_2_title,
      description: t.onboarding_2_desc,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: t.onboarding_3_title,
      description: t.onboarding_3_desc,
      icon: Lock,
      color: 'bg-red-50 text-red-600'
    },
    {
      title: t.onboarding_4_title,
      description: t.onboarding_4_desc,
      icon: Bot,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'IBAN & SWIFT',
      description: t.onboarding_3_desc,
      icon: CreditCard,
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  const handleNext = () => {
    if (cardIndex < tutorialCards.length - 1) {
      setCardIndex(prev => prev + 1);
    } else {
      onComplete(language);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        <div className="p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {step === 'language' ? (
              <motion.div 
                key="language"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <Globe size={40} className="text-[#FF0000]" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Choose Language</h2>
                  <p className="text-gray-500">Select your preferred language to continue</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                        language === lang.code 
                          ? "border-[#FF0000] bg-red-50/50 text-[#FF0000]" 
                          : "border-gray-100 hover:border-gray-200 text-gray-600"
                      )}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-bold">{lang.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep('tutorial')}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="tutorial"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-center gap-2 mb-8">
                  {tutorialCards.map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === cardIndex ? "w-8 bg-[#FF0000]" : "w-2 bg-gray-200"
                      )}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={cardIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-6"
                  >
                    <div className={cn(
                      "w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3",
                      tutorialCards[cardIndex].color
                    )}>
                      {React.createElement(tutorialCards[cardIndex].icon, { size: 48 })}
                    </div>
                    
                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                        {tutorialCards[cardIndex].title}
                      </h2>
                      <p className="text-gray-500 text-lg leading-relaxed">
                        {tutorialCards[cardIndex].description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="pt-8">
                  <button
                    onClick={handleNext}
                    className="w-full py-5 bg-[#FF0000] text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                  >
                    {cardIndex === tutorialCards.length - 1 ? t.get_started : t.next}
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
