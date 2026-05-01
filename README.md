# 🏭 Tikuvchilik Zavodi — MVP Tizimi

Ushbu loyiha **3 qismdan** iborat:
- `backend/` — FastAPI (Python) REST API
- `frontend/` — React web dashboard (TV + Boss + Admin + Sales)
- `mobile/` — React Native Android ilovasi

---

## 🚀 TEZKOR ISHGA TUSHIRISH

### 1. PostgreSQL ma'lumotlar bazasini yarating

```bash
psql -U postgres
CREATE DATABASE factory_db;
\q
```

### 2. Backend ishga tushiring

```bash
cd backend

# Virtual muhit yarating
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Kutubxonalarni o'rnating
pip install -r requirements.txt

# .env faylini sozlang
cp .env.example .env
# DATABASE_URL, SECRET_KEY ni o'zgartiring

# Jadvallarni yarating (pgAdmin shart emas)
python create_tables.py

# Dastlabki foydalanuvchilar va ma'lumotlar kiriting
python seed.py

# Serverni ishga tushiring
uvicorn app.main:app --reload --port 8000
```

✅ API: http://127.0.0.1:8000  
✅ Docs: http://127.0.0.1:8000/docs

---

### 3. Frontend dashboard ishga tushiring

```bash
cd frontend
npm install
npm start
```

✅ Dashboard: http://localhost:3000

**Login ma'lumotlari (seed.py dan):**
| Username | Parol    | Rol   | Sahifa  |
|----------|----------|-------|---------|
| admin    | admin123 | Admin | /admin  |
| boss     | boss123  | Boss  | /boss   |
| sales    | sales123 | Sales | /sales  |

> `/tv` sahifasi — login talab qilmaydi (TV ekran uchun ochiq)

---

### 4. Mobile ilovani ishga tushiring

```bash
cd mobile
npm install

# Android qurilmani ulang yoki emulator oching
npx react-native run-android
```

> ⚠️ `mobile/src/services/api.js` faylida `BASE_URL` ni serveringiz IP manziliga o'zgartiring.  
> Masalan: `http://192.168.1.100:8000`

---

## 🌐 Sahifalar va rollar

| URL      | Kimga ochiq | Tavsif                                      |
|----------|-------------|---------------------------------------------|
| /tv      | Hamma       | TV ekran — real-time ishlab chiqarish monitor |
| /login   | Hamma       | Kirish sahifasi                              |
| /admin   | admin       | To'liq boshqaruv paneli (6 tab)             |
| /boss    | boss        | Ko'rish paneli — statistika, ishchilar, maosh |
| /sales   | sales       | Sotuv kiritish va bugungi sotuvlar          |

---

## 📱 Foydalanuvchi rollari

| Rol   | Qila oladigan ishlari                                      |
|-------|------------------------------------------------------------|
| Admin | Ishchilar, foydalanuvchilar, materiallar, maosh, sotuv boshqarish |
| Boss  | Faqat ko'rish: statistika, ishchilar, materiallar, kunlik maosh |
| Sales | Faqat sotuv kiritish va bugungi sotuvlarni ko'rish         |

---

## 🗄️ Ma'lumotlar bazasi modellari

| Jadval           | Asosiy maydonlar                                              |
|------------------|---------------------------------------------------------------|
| users            | id, username, hashed_password, role, created_at               |
| workers          | id, firstname, lastname, age, position, is_active, created_at |
| production_logs  | id, worker_id, daily_salary, date, logged_by, created_at      |
| materials        | id, name, quantity_rolls, length_meters, date, created_at     |
| sales_logs       | id, amount, description, timestamp, created_by                |
| form_fields      | id, name, label, field_type, is_required, order               |

---

## 🔌 API Endpointlar (asosiylar)

| Method | URL                        | Kimga   | Tavsif                  |
|--------|----------------------------|---------|-------------------------|
| POST   | /api/auth/login            | Hamma   | Token olish             |
| GET    | /api/dashboard/top         | Hamma   | Top ishchilar (TV)      |
| GET    | /api/dashboard/daily       | Hamma   | Bugungi statistika (TV) |
| GET    | /api/dashboard/weekly      | Hamma   | Haftalik trend (TV)     |
| GET    | /api/dashboard/admin-stats | admin   | Admin statistikasi      |
| GET    | /api/workers               | admin, boss | Ishchilar ro'yxati  |
| POST   | /api/workers               | admin   | Yangi ishchi            |
| GET    | /api/production            | admin, boss | Maosh jurnali       |
| POST   | /api/production            | admin   | Maosh kiritish          |
| GET    | /api/materials             | admin, boss | Materiallar         |
| POST   | /api/materials             | admin   | Material kiritish       |
| GET    | /api/sales                 | admin, boss, sales | Sotuvlar       |
| POST   | /api/sales                 | admin, sales | Sotuv kiritish      |
| GET    | /api/users                 | admin   | Foydalanuvchilar        |
| PUT    | /api/users/{id}/role       | admin   | Rol o'zgartirish        |

---

## 📁 Loyiha strukturasi

```
factory_mvp/fp/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── worker.py
│   │   │   ├── production.py
│   │   │   ├── material.py
│   │   │   └── sales.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── workers.py
│   │       ├── production.py
│   │       ├── sales.py
│   │       ├── materials.py
│   │       ├── dashboard.py
│   │       ├── users.py
│   │       └── fields.py
│   ├── create_tables.py    ← jadvallarni yaratish (pgAdmin shart emas)
│   ├── seed.py             ← boshlang'ich ma'lumotlar
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── TVDashboard.js   ← public, login shart emas
│   │   │   ├── AdminPanel.js    ← 6 tab: statistika, ishchilar, foydalanuvchilar, materiallar, maosh, forma
│   │   │   ├── BossPanel.js     ← 4 tab: statistika, ishchilar, materiallar, kunlik maosh
│   │   │   └── SalesPage.js     ← sotuv kiritish + bugungi ro'yxat
│   │   ├── hooks/
│   │   │   └── useAutoRefresh.js
│   │   ├── services/
│   │   │   └── api.js           ← BASE_URL: http://127.0.0.1:8000
│   │   └── store/
│   │       └── AuthContext.js
│   └── package.json
└── mobile/
    ├── src/
    │   ├── screens/
    │   ├── services/
    │   └── store/
    └── package.json
```

---

## 🌐 Deploy (Railway.app)

1. [railway.app](https://railway.app) ga kiring
2. "New Project" → "Deploy from GitHub"
3. Backend repo ni tanlang
4. PostgreSQL plugin qo'shing
5. Environment variables:
   ```
   DATABASE_URL=<Railway avtomatik beradi>
   SECRET_KEY=uzun-random-kalit-min-32-belgi
   ```
6. Frontend uchun [vercel.com](https://vercel.com) ga deploy qiling  
   `REACT_APP_API_URL=https://your-backend.railway.app` ni `.env` ga qo'shing

---

## 🔒 Xavfsizlik eslatmalari

- `.env` faylini **hech qachon** GitHub ga yuklamang
- `SECRET_KEY` ni kamida 32 belgi uzunligida qiling
- Deploy qilganda `allow_origins=["*"]` ni o'z domeningizga o'zgartiring

---

## 📞 Yordam

Biror muammo bo'lsa:
1. `uvicorn app.main:app --reload` ni qayta ishga tushiring
2. `http://127.0.0.1:8000/docs` da API ni tekshiring
3. Frontendda `src/services/api.js` da `BASE_URL` to'g'ri ekanligini tekshiring
