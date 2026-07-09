import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './uz';
import uzCyrl from './uz-cyrl';

const savedLang = localStorage.getItem('lang') || 'uz';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      'uz-cyrl': { translation: uzCyrl }
    },
    lng: savedLang,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
