# 🎓 DigitalEdu — Raqamli Pedagogika Platformasi

DigitalEdu — bo'lajak pedagoglarni ko'p tillilik muhitda raqamli texnologiyalardan foydalanish metodikasiga o'rgatuvchi zamonaviy ta'lim platformasi. Platforma testlar, amaliy mashg'ulotlar, baholash tizimi va reyting orqali o'quv jarayonini interaktiv va qiziqarli qiladi.

---

## 📖 Loyiha haqida

Platforma uch xil foydalanuvchi roli asosida ishlaydi: **Talaba**, **O'qituvchi** va **Administrator**. Har bir rol o'ziga xos imkoniyatlarga ega. Talabalar bilimini sinaydi va amaliyot bajaradi, o'qituvchilar ishlarni baholaydi va kontent qo'shadi, administrator esa butun tizimni boshqaradi.

Interfeys **3 tilda** ishlaydi: O'zbek, Rus va Ingliz.

---

## ✨ Asosiy funksiyalar

### 👤 Foydalanuvchi rollari

| Rol | Imkoniyatlar |
|-----|-------------|
| **🎓 Talaba (Student)** | Darslarni o'rganish, test va amaliyot bajarish, Word fayl yuklash, reytingni ko'rish, o'qituvchi rolini so'rash |
| **👨‍🏫 O'qituvchi (Teacher)** | Talabalar ishlarini baholash, yangi mavzu/test/amaliyot qo'shish, talabalar ro'yxati va natijalarini kuzatish |
| **👑 Administrator (Admin)** | Barcha imkoniyatlar: kontent boshqaruvi, foydalanuvchilarga rol berish, rol so'rovlarini tasdiqlash, baholash |

### 📚 O'quv jarayoni

- **Diagnostik test** — yangi foydalanuvchining boshlang'ich bilim darajasini aniqlaydi
- **O'quv dasturi (Curriculum)** — bosqichma-bosqich mavzular tizimi
- **Testlar (Quizzes)** — har bir mavzu bo'yicha bilimni sinash
- **Amaliyot (Practice)** — bosqichli amaliy mashg'ulotlar (vaqt taymeri bilan)
- **Sertifikat** — kursni tugatgan talabalarga

### 📝 Topshiriq va baholash tizimi

- Talaba amaliyot uchun **Word fayl** (.doc/.docx, maksimal 10 MB) yuklaydi
- Fayl Supabase Storage'da xavfsiz saqlanadi
- O'qituvchi faylni yuklab oladi, ko'rib chiqadi va **ball (0-100)** hamda **izoh** beradi
- Baholangan ish uchun talaba **XP** (tajriba ballari) oladi
- XP formulasi: `XP = (ball / 100) × 50`

### 🏆 Geymifikatsiya (o'yinlashtirun)

- **XP tizimi** — testlar, amaliyotlar va baholangan ishlardan ball to'planadi
- **Darajalar (Level)** — har 100 XP yangi daraja
- **Yutuqlar (Achievements)** — turli bosqichlar uchun mukofotlar
- **Kunlik faollik (Streak)** — ketma-ket kunlar
- **Reyting (Leaderboard)** — barcha talabalarni umumiy XP bo'yicha tartiblaydi

### 🔄 O'qituvchi roli so'rovi

Talaba o'qituvchi bo'lishni xohlasa, so'rov yuboradi. Administrator so'rovni ko'rib chiqib, tasdiqlaydi yoki rad etadi. Tasdiqlangach, talaba avtomatik o'qituvchiga aylanadi.

---

## 🛠 Texnologiyalar

| Soha | Texnologiya |
|------|-------------|
| Frontend | React 18 + TypeScript |
| Build vositasi | Vite 6 |
| Styling | Tailwind CSS 3 |
| State boshqaruvi | Zustand 5 |
| Animatsiya | Framer Motion 11 |
| Marshrutlash | React Router 7 |
| Backend / Baza | Supabase (PostgreSQL + Auth + Storage) |
| Ikonlar | Lucide React |

---

## 🗄 Ma'lumotlar bazasi tuzilishi

Platforma Supabase (PostgreSQL) bazasidan foydalanadi. Asosiy jadvallar:

- **profiles** — foydalanuvchi profillari va rollari
- **content_items** — darslar, testlar va amaliyotlar
- **diagnostic_results / quiz_results / practice_results** — natijalar
- **submissions** — talaba yuklagan fayllar va ularning baholari
- **role_requests** — o'qituvchi roli so'rovlari
- **leaderboard_view** — reyting (avtomatik hisoblanadi)

Xavfsizlik **Row Level Security (RLS)** orqali ta'minlanadi — har bir rol faqat o'ziga ruxsat etilgan amallarni bajara oladi.

---

## 🚀 Ishga tushirish

### 1. Loyihani yuklash
```bash
git clone https://github.com/durd1ma7ov06/Digital-edu.git
cd Digital-edu
npm install
```

### 2. Supabase sozlash
`.env` faylida Supabase ma'lumotlarini kiriting:
```env
VITE_SUPABASE_URL=https://sizning-loyiha.supabase.co
VITE_SUPABASE_ANON_KEY=sizning-anon-key
```

### 3. Bazani yaratish
Supabase Dashboard → SQL Editor'da `supabase_full_setup.sql` faylini ishga tushiring. Bu barcha jadval, funksiya va xavfsizlik sozlamalarini yaratadi.

> Bazani tozalash (qayta o'rnatish) kerak bo'lsa, avval `supabase_RESET.sql` ni ishga tushiring.

### 4. Loyihani ishga tushirish
```bash
npm run dev
```
Brauzerda `http://localhost:5173` ochiladi.

### 5. Build (production)
```bash
npm run build
```

---

## 🔑 Administrator kirishi

Admin foydalanuvchini Supabase Dashboard → Authentication → Users orqali yarating, so'ngra SQL Editor'da admin roli bering:

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'sizning-email@example.com');
```

---

## 📂 Loyiha tuzilishi

```
src/
├── components/      # Qayta ishlatiluvchi komponentlar (Sidebar, FileUploadButton, GradingForm...)
├── pages/           # Sahifalar (Dashboard, AdminPanel, TeacherPanel, Quizzes, Practice...)
├── store/           # Zustand store'lar (auth, content, submissions, role requests, i18n)
├── types/           # TypeScript tiplari
├── utils/           # Yordamchi funksiyalar (fayl validatsiyasi, XP hisoblash)
├── lib/             # Supabase klienti
└── data/            # Statik o'quv kontenti

supabase_full_setup.sql   # To'liq baza setup
supabase_RESET.sql        # Bazani tozalash
```

---

## 🌐 Tillar

Platforma to'liq 3 tilda ishlaydi. Foydalanuvchi istalgan vaqtda tilni almashtirishi mumkin:
- 🇺🇿 O'zbek
- 🇷🇺 Rus
- 🇬🇧 Ingliz

---

## 📄 Litsenziya

Ushbu loyiha ta'lim maqsadlarida ishlab chiqilgan.
