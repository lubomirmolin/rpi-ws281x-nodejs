# Raspberry Pi ws281x library for Node.js 

**Disclaimer:** This library is heavily inspired by [beyondscreen/node-rpi-ws281x-native](https://github.com/beyondscreen/node-rpi-ws281x-native)

> if you happen to know C++ and node/iojs/V8, I would really appreciate any help 
> and feedback on this module.
> There is certainly lots of room for improvement.

This module provides native bindings to the
[rpi_ws281x](https://github.com/jgarff/rpi_ws281x) library by Jeremy Garff to
provide a very basic set of functions to write data to a strip of
ws2811/ws2812 LEDs. **this will only run on the Raspberry Pi.**

## Setup

this module is available via npm:

    npm i @bartando/rpi-ws281x-nodejs --save

if you prefer installing from source:

    npm install -g node-gyp
    git clone --recursive https://github.com/lubomirmolin/rpi-ws281x-nodejs
    cd rpi-ws281x-nodejs
    npm install
    node-gyp rebuild

## Usage

```javascript
exports = {
    /**
     * configures PWM and DMA for sending data to the LEDs.
     *
     * @param {?Object} options  intialization-options for the library
     *                           (*count = required, frequency = default 800000, dmaNum = default 10, 
     *                             gpioPin = default 18, invert = default false, brightness = default 100 [range 0 - 100], 
     *                             stripType = default WS2811_STRIP_RGB [see types below])
     */
    init: function(options) {},

    /**
     * Sets color for the pixel by position
     *
     * @param position
     * @param {r, g, b}
     */
    setPixelColor: function (position, {r, g, b}) {},

    /**
     * Sets one color for the whole strip
     * @param {r, g, b}
     */
    setAllColor: function ({r, g, b}) {},

    /**
     * set the overall-brightness for the entire strip.
     *
     * @param {Number} brightness value from 0 to 100.
     */
    setBrightness: function(brightness) {},

    
    /**
     * show data on the LED-strip. Needs to be called for changes to take place
     *
     */
    show: function() {},

    /**
     * clears all LEDs, resets the PWM and DMA-parts and deallocates
     * all internal structures.
     */
    reset: function() {},
    
    /**
     * Retrieves color at given pixel position
     * @param position
     */
    getPixelColor: function (position) {}
}
```

The strip types:

```
    # 4 color R, G, B and W ordering
    SK6812_STRIP_RGBW
    SK6812_STRIP_RBGW
    SK6812_STRIP_GRBW
    SK6812_STRIP_GBRW
    SK6812_STRIP_BRGW
    SK6812_STRIP_BGRW
    
    # 3 color R, G and B ordering
    WS2811_STRIP_RGB # Default
    WS2811_STRIP_RBG
    WS2811_STRIP_GRB
    WS2811_STRIP_GBR
    WS2811_STRIP_BRG
    WS2811_STRIP_BGR
```

## For the usage look at the colorwipe.js example

Run by ```sudo node examples/colorwipe.js``` 
