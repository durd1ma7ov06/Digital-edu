// Avtomatik tarjima utility — Google Translate ochiq endpoint orqali.
// Admin bitta tilda yozadi, matn 3 tilga (uz, ru, en) avtomatik tarjima qilinadi.

export type Lang = 'uz' | 'ru' | 'en'

interface MultiLangText {
  uz: string
  ru: string
  en: string
}

// Bitta matnni manba tildan maqsad tilga tarjima qiladi
async function translateOne(text: string, from: Lang, to: Lang): Promise<string> {
  if (!text.trim() || from === to) return text
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url)
    if (!res.ok) return text
    const data = await res.json()
    // data[0] — tarjima qismlari massivi
    const translated = (data?.[0] || []).map((part: unknown[]) => part[0]).join('')
    return translated || text
  } catch {
    // Tarjima muvaffaqiyatsiz bo'lsa, asl matnni qaytaramiz
    return text
  }
}

// Bitta matnni 3 tilga tarjima qiladi (manba tildan boshqa 2 tilga)
export async function translateToAll(text: string, source: Lang): Promise<MultiLangText> {
  const langs: Lang[] = ['uz', 'ru', 'en']
  const result: MultiLangText = { uz: text, ru: text, en: text }

  await Promise.all(
    langs.map(async (lang) => {
      if (lang === source) {
        result[lang] = text
      } else {
        result[lang] = await translateOne(text, source, lang)
      }
    })
  )

  return result
}

// Matnlar massivini 3 tilga tarjima qiladi (test variantlari uchun)
export async function translateArrayToAll(
  texts: string[],
  source: Lang
): Promise<{ uz: string[]; ru: string[]; en: string[] }> {
  const translations = await Promise.all(texts.map((t) => translateToAll(t, source)))
  return {
    uz: translations.map((t) => t.uz),
    ru: translations.map((t) => t.ru),
    en: translations.map((t) => t.en),
  }
}
