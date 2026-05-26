# Avionix IMU Ucus Simulasyonu

Bu proje, ESP32-S3 + MPU6050 kartindan USB Serial ile gelen roll, pitch ve yaw verilerini tarayicida okuyup Three.js tabanli 3D IHA modeline uygular.

Web arayuzu yalnizca PC tarafidir. Firmware karta yuklenir, web sitesi ise seri porttan gelen veriyi okur ve modeli dondurur.

## Dosya Yapisi

```text
firmware/
  esp32s3_mpu6050_orientation/
    esp32s3_mpu6050_orientation.ino

dashboard/
  index.html
  style.css
  app.js
  assets/
    models/
```

## Web Arayuzu

`dashboard/index.html` sayfasi su ozellikleri icerir:

- Web Serial API ile `navigator.serial.requestPort()` baglantisi
- `115200` baud rate
- `Cihaza Baglan` ve `Baglantiyi Kes` kontrolleri
- Roll, pitch, yaw sayisal gostergeleri
- Son veri zamani ve `Veri bekleniyor` durumu
- JSON ve metin tabanli veri formati destegi
- Eksen mapping secimleri ve roll/pitch/yaw invert ayarlari
- `Sifirla / Kalibre Et` ile mevcut acilari referans alma
- Three.js ile gecici sabit kanat IHA modeli, grid ve eksen referansi

Web Serial API Chrome ve Edge gibi destekleyen tarayicilarda calisir. Vercel HTTPS uzerinden yayinladigi icin Web Serial icin uygundur.

## Desteklenen Serial Formatlari

Firmware asagidaki formatlardan birini satir satir gonderebilir:

```text
ROLL:12.5,PITCH:-3.2,YAW:45.8
```

```json
{"roll":12.5,"pitch":-3.2,"yaw":45.8}
```

Hatali veya eksik satirlar atlanir; uygulama bu satirlar yuzunden cokmez.

## Firmware

Arduino IDE veya Arduino CLI ile `firmware/esp32s3_mpu6050_orientation/esp32s3_mpu6050_orientation.ino` dosyasini ESP32-S3 karta yukleyin.

Onerilen ayarlar:

- Baud rate: `115200`
- SDA: `GPIO20`
- SCL: `GPIO21`
- USB CDC / Serial ayari kartiniza gore etkin olmalidir

MPU6050 manyetometre icermedigi icin yaw degeri zamanla drift yapabilir.
