const int BAUD_RATE = 19200;
const int DELAY_MS = 100;

void setup() {
  Serial.begin(BAUD_RATE);
}

void loop() {

  float y1 = random(0, 101);
  float y2 = random(0, 101);
  float y3 = random(0, 101);
  float y4 = random(0, 101);

  Serial.print("Y1 : ");
  Serial.print(y1, 2);
  Serial.print(",Y2 : ");
  Serial.print(y2, 2);
  Serial.print(",Y3 : ");
  Serial.print(y3, 2);
  Serial.print(",Y4 : ");
  Serial.println(y4, 2);

  delay(DELAY_MS);
  
}