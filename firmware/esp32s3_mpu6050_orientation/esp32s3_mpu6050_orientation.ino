#include <Wire.h>

const int MPU_SDA_PIN = 20;
const int MPU_SCL_PIN = 21;

const uint8_t MPU6050_ADDR = 0x68;
const uint8_t MPU6050_PWR_MGMT_1 = 0x6B;
const uint8_t MPU6050_ACCEL_XOUT_H = 0x3B;
const uint8_t MPU6050_GYRO_CONFIG = 0x1B;
const uint8_t MPU6050_ACCEL_CONFIG = 0x1C;

const float ACCEL_SCALE = 16384.0f; // +/-2g
const float GYRO_SCALE = 131.0f;    // +/-250 deg/s
const float FILTER_ALPHA = 0.98f;

const unsigned long SERIAL_INTERVAL_MS = 20;
const int CALIBRATION_SAMPLES = 600;

float gyroXOffset = 0.0f;
float gyroYOffset = 0.0f;
float gyroZOffset = 0.0f;

float roll = 0.0f;
float pitch = 0.0f;
float yaw = 0.0f;

unsigned long lastUpdateMicros = 0;
unsigned long lastSerialMs = 0;
bool filterInitialized = false;

struct MpuRawData {
  int16_t accelX;
  int16_t accelY;
  int16_t accelZ;
  int16_t gyroX;
  int16_t gyroY;
  int16_t gyroZ;
};

void writeMpuRegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission(true);
}

bool readMpuData(MpuRawData &data) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(MPU6050_ACCEL_XOUT_H);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  const uint8_t bytesToRead = 14;
  if (Wire.requestFrom(MPU6050_ADDR, bytesToRead, true) != bytesToRead) {
    return false;
  }

  data.accelX = (Wire.read() << 8) | Wire.read();
  data.accelY = (Wire.read() << 8) | Wire.read();
  data.accelZ = (Wire.read() << 8) | Wire.read();
  Wire.read();
  Wire.read();
  data.gyroX = (Wire.read() << 8) | Wire.read();
  data.gyroY = (Wire.read() << 8) | Wire.read();
  data.gyroZ = (Wire.read() << 8) | Wire.read();

  return true;
}

void configureMpu6050() {
  writeMpuRegister(MPU6050_PWR_MGMT_1, 0x00);
  delay(100);
  writeMpuRegister(MPU6050_GYRO_CONFIG, 0x00);
  writeMpuRegister(MPU6050_ACCEL_CONFIG, 0x00);
}

void calibrateGyro() {
  long gyroXSum = 0;
  long gyroYSum = 0;
  long gyroZSum = 0;
  int validSamples = 0;

  for (int i = 0; i < CALIBRATION_SAMPLES; i++) {
    MpuRawData data;
    if (readMpuData(data)) {
      gyroXSum += data.gyroX;
      gyroYSum += data.gyroY;
      gyroZSum += data.gyroZ;
      validSamples++;
    }
    delay(3);
  }

  if (validSamples > 0) {
    gyroXOffset = gyroXSum / (float)validSamples;
    gyroYOffset = gyroYSum / (float)validSamples;
    gyroZOffset = gyroZSum / (float)validSamples;
  }
}

void calculateAccelAngles(float accelX, float accelY, float accelZ, float &accelRoll, float &accelPitch) {
  accelRoll = atan2(accelY, accelZ) * 180.0f / PI;
  accelPitch = atan2(-accelX, sqrt(accelY * accelY + accelZ * accelZ)) * 180.0f / PI;
}

void updateOrientation(const MpuRawData &data) {
  const unsigned long nowMicros = micros();
  float dt = (nowMicros - lastUpdateMicros) / 1000000.0f;
  lastUpdateMicros = nowMicros;

  if (dt <= 0.0f || dt > 1.0f) {
    dt = 0.02f;
  }

  const float accelX = data.accelX / ACCEL_SCALE;
  const float accelY = data.accelY / ACCEL_SCALE;
  const float accelZ = data.accelZ / ACCEL_SCALE;

  const float gyroXRate = (data.gyroX - gyroXOffset) / GYRO_SCALE;
  const float gyroYRate = (data.gyroY - gyroYOffset) / GYRO_SCALE;
  const float gyroZRate = (data.gyroZ - gyroZOffset) / GYRO_SCALE;

  float accelRoll = 0.0f;
  float accelPitch = 0.0f;
  calculateAccelAngles(accelX, accelY, accelZ, accelRoll, accelPitch);

  if (!filterInitialized) {
    roll = accelRoll;
    pitch = accelPitch;
    yaw = 0.0f;
    filterInitialized = true;
    return;
  }

  roll = FILTER_ALPHA * (roll + gyroXRate * dt) + (1.0f - FILTER_ALPHA) * accelRoll;
  pitch = FILTER_ALPHA * (pitch + gyroYRate * dt) + (1.0f - FILTER_ALPHA) * accelPitch;
  yaw += gyroZRate * dt;

  if (yaw > 180.0f) {
    yaw -= 360.0f;
  } else if (yaw < -180.0f) {
    yaw += 360.0f;
  }
}

void sendOrientationJson() {
  Serial.print("{\"roll\":");
  Serial.print(roll, 2);
  Serial.print(",\"pitch\":");
  Serial.print(pitch, 2);
  Serial.print(",\"yaw\":");
  Serial.print(yaw, 2);
  Serial.println("}");
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  Wire.begin(MPU_SDA_PIN, MPU_SCL_PIN);
  Wire.setClock(400000);

  configureMpu6050();
  calibrateGyro();

  lastUpdateMicros = micros();
  lastSerialMs = millis();
}

void loop() {
  MpuRawData data;
  if (!readMpuData(data)) {
    delay(20);
    return;
  }

  updateOrientation(data);

  const unsigned long nowMs = millis();
  if (nowMs - lastSerialMs >= SERIAL_INTERVAL_MS) {
    lastSerialMs = nowMs;
    sendOrientationJson();
  }
}
