# Mühendislik Hesaplama ve Simülasyon Platformu

React + Vite frontend ve Python FastAPI backend ile geliştirilen mühendislik web uygulaması.

## Amaç

Uygulama local geliştirmede şu adreslerle çalışır:

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8001`

Production yayında ise:

- Frontend Vercel üzerinde çalışır.
- Backend Render veya Railway gibi bir Web Service üzerinde çalışır.
- Frontend backend adresini `VITE_API_BASE_URL` environment variable değerinden alır.
- Backend sadece izin verilen frontend originlerinden gelen istekleri kabul eder.

## Local Çalıştırma

Backend için Windows + VS Code + PowerShell terminalinde:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

`uvicorn` komutunu doğrudan çağırmak yerine `python -m uvicorn` kullanmak PATH sorunlarını önler. 8000 portunda Windows erişim izni veya port çakışması görülebileceği için local backend için 8001 önerilir.

Frontend için yeni bir PowerShell terminalinde:

```powershell
cd frontend
npm install
npm run dev
```

Local site:

```text
http://localhost:5173
```

Backend sağlık kontrolü:

```text
http://127.0.0.1:8001/api/health
```

Beklenen cevap:

```json
{ "status": "ok", "message": "Backend çalışıyor" }
```

## API URL Ayarı

Frontend API adresi tek yerden `frontend/src/config.js` içinde yönetilir:

```js
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";
```

Localde environment variable vermeniz gerekmez; varsayılan olarak `http://127.0.0.1:8001` kullanılır.

Production'da Vercel üzerinde şu environment variable verilmelidir:

```text
VITE_API_BASE_URL=https://RENDER_BACKEND_ADRESI.onrender.com
```

## Backend Endpointleri

- `GET /api/health`
- `POST /api/bayhes/simulate`
- `GET /favicon.ico`

Not: `favicon.ico` 404 hatası giderildi. Bu hata görülse bile genellikle backend'in çalışmadığı anlamına gelmez; tarayıcının sekme ikonu için otomatik yaptığı ayrı bir istektir.

## Frontend Deploy: Vercel

Vercel proje ayarları:

```text
Root directory:
frontend

Build command:
npm run build

Output directory:
dist

Environment variable:
VITE_API_BASE_URL=https://RENDER_BACKEND_ADRESI.onrender.com
```

React Router ile sayfa yenilemede 404 olmaması için `frontend/vercel.json` dosyasında rewrite ayarı vardır:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## Backend Deploy: Render

Render üzerinde yeni bir Web Service oluşturun.

Render ayarları:

```text
Service type:
Web Service

Root directory:
backend

Build command:
pip install -r requirements.txt

Start command:
python -m uvicorn main:app --host 0.0.0.0 --port $PORT

Environment variables:
FRONTEND_ORIGIN=https://VERCEL_SITE_ADRESI.vercel.app
```

`FRONTEND_ORIGIN` değeri Vercel frontend adresiniz olmalıdır. Örnek:

```text
FRONTEND_ORIGIN=https://avionix-demo.vercel.app
```

## Backend Deploy: Railway

Railway üzerinde backend klasörünü servis olarak yayınlayın.

Önerilen ayarlar:

```text
Root directory:
backend

Install/build command:
pip install -r requirements.txt

Start command:
python -m uvicorn main:app --host 0.0.0.0 --port $PORT

Environment variables:
FRONTEND_ORIGIN=https://VERCEL_SITE_ADRESI.vercel.app
```

Railway size farklı bir backend domaini verir. Bu backend domainini Vercel tarafında `VITE_API_BASE_URL` olarak kullanın.

## Deploy Sırası

1. Backend'i Render veya Railway'e deploy edin.
2. Backend URL'nizi alın. Örnek: `https://avionix-backend.onrender.com`
3. Frontend'i Vercel'e deploy ederken `VITE_API_BASE_URL` değerini backend URL'niz yapın.
4. Frontend Vercel URL'nizi alın. Örnek: `https://avionix-demo.vercel.app`
5. Backend servisindeki `FRONTEND_ORIGIN` değerini Vercel URL'niz yapın.
6. Backend'i yeniden deploy edin veya servisi restart edin.

Deploydan sonra kullanıcı sadece Vercel adresine girer:

```text
https://VERCEL_SITE_ADRESI.vercel.app
```

Artık terminal açmasına gerek kalmaz. Telefon, tablet, okul bilgisayarı veya başka cihazlardan bu link ile erişebilir.

## Production Build Kontrolü

Frontend build:

```powershell
cd frontend
npm install
npm run build
```

Backend production start komutu:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

Windows local geliştirme için `$PORT` kullanmayın; local komut 8001 portunu açıkça verir.
