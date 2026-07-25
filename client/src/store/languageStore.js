import { create } from 'zustand';

function readStoredLang() {
  try {
    const raw = localStorage.getItem('nilechat_lang');
    return raw === 'en' || raw === 'ar' ? raw : 'ar';
  } catch {
    return 'ar';
  }
}

function applyDocumentLang(lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

const initialLang = readStoredLang();
applyDocumentLang(initialLang);

const useLanguageStore = create((set, get) => ({
  lang: initialLang,

  setLang: (lang) => {
    if (lang !== 'ar' && lang !== 'en') return;
    localStorage.setItem('nilechat_lang', lang);
    applyDocumentLang(lang);
    set({ lang });
  },

  toggleLang: () => {
    const next = get().lang === 'ar' ? 'en' : 'ar';
    get().setLang(next);
  },
}));

export default useLanguageStore;
