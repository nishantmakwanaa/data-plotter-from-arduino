const int BAUD_RATE = 9600;
const int DELAY_MS = 100;

const int patternLength = 10;
const float pattern[] = {0.0, 0.2, 0.4, 0.8, 2.5, 1.2, 0.6, 0.3, 0.1, 0.0};
int patternIndex = 0;

float baselineX = 70.0;
float baselineY = 95.0;

void setup() {
  Serial.begin(BAUD_RATE);
}

void loop() {

  float x = baselineX + pattern[patternIndex] * 10 + random(-5, 5);
  float y = baselineY + pattern[patternIndex] + random(-2, 2);
  
  y = constrain(y, 0, 100);

  Serial.print(x, 2);
  Serial.print(",");
  Serial.println(y, 2);

  patternIndex = (patternIndex + 1) % patternLength;
  
  delay(DELAY_MS);

}