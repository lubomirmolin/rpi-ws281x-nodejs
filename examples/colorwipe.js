const ws281x = require('../index');

const NUM_LEDS = 16;

ws281x.init({count: NUM_LEDS, stripType: ws281x.WS2811_STRIP_GRB});

// Just so you don't get blind
ws281x.setBrightness(5);

const waitTime = 50;

// Probably best way to use something like time.sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let offset = 0;

async function colorWipe(color) {
  for (let i = 0; i < NUM_LEDS; i++) {
    ws281x.setPixelColor(i, color);
    ws281x.show();
    await sleep(waitTime);
  }

  offset = (offset + 1) % NUM_LEDS;
}

// Cycle through 3 main colors
setInterval(async () => {
  await colorWipe({r: 255, g: 0, b: 0});
  await colorWipe({r: 0, g: 255, b: 0});
  await colorWipe({r: 0, g: 0, b: 255});
}, waitTime * NUM_LEDS * 3);

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  ws281x.reset();
  process.nextTick(function () { process.exit(0); });
});
