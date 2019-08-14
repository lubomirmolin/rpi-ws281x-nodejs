const EventEmitter = require('events').EventEmitter;

function getNativeBindings() {
    const stub = {
        init: function() {},
        render: function() {},
        setBrightness: function() {},
        reset: function() {},
        isStub: true
    };

    if (!process.getuid || process.getuid() !== 0) {
        console.warn('[rpi-ws281x-native] This module requires being run ' +
            'with root-privileges. A non-functional stub of the ' +
            'interface will be returned.');

        return stub;
    }

    // the native module might even be harmful (or won't work in the best case)
    // in the wrong environment, so we make sure that at least everything we can
    // test for matches the raspberry-pi before loading the native-module
    if (process.arch !== 'arm' && process.platform !== 'linux') {
        console.warn('[rpi-ws281x-native] It looks like you are not ' +
            'running on a raspberry pi. This module will not work ' +
            'on other platforms. A non-functional stub of the ' +
            'interface will be returned.');

        return stub;
    }

    // determine rapsberry-pi version based on SoC-family. (note: a more
    // detailed way would be to look at the revision-field from cpuinfo, see
    // http://elinux.org/RPi_HardwareHistory)
    var raspberryVersion = (function() {
        var cpuInfo = require('fs').readFileSync('/proc/cpuinfo').toString(),
            socFamily = cpuInfo.match(/hardware\s*:\s*(bcm\d+)/i);

        if(!socFamily) { return 0; }

        switch(socFamily[1].toLowerCase()) {
            case 'bcm2708': return 1;
            case 'bcm2835': return 1;
            case 'bcm2709': return 2;
            default: return 0;
        }
    } ());

    if (raspberryVersion === 0) {
        console.warn('[rpi-ws281x-native] Could not verify raspberry-pi ' +
            'version. If this is wrong and you are running this on a ' +
            'raspberry-pi, please file a bug-report at ' +
            '  https://github.com/beyondscreen/node-rpi-ws281x-native/issues\n' +
            'A non-functional stub of this modules interface will be ' +
            'returned.');

        return stub;
    }

    return require('./binding/rpi_ws281x.node');
}

const bindings = getNativeBindings();

const ws281x = new EventEmitter();
let _isInitialized = false;
let _pixelData = null;
let _options = null;

// 4 color R, G, B and W ordering
ws281x.SK6812_STRIP_RGBW = 0x18100800;
ws281x.SK6812_STRIP_RBGW = 0x18100008;
ws281x.SK6812_STRIP_GRBW = 0x18081000;
ws281x.SK6812_STRIP_GBRW = 0x18080010;
ws281x.SK6812_STRIP_BRGW = 0x18001008;
ws281x.SK6812_STRIP_BGRW = 0x18000810;
ws281x.SK6812_SHIFT_WMASK = 0xf0000000;

// 3 color R, G and B ordering
ws281x.WS2811_STRIP_RGB = 0x00100800;
ws281x.WS2811_STRIP_RBG = 0x00100008;
ws281x.WS2811_STRIP_GRB = 0x00081000;
ws281x.WS2811_STRIP_GBR = 0x00080010;
ws281x.WS2811_STRIP_BRG = 0x00001008;
ws281x.WS2811_STRIP_BGR = 0x00000810;

ws281x.init = function(options) {
    _isInitialized = true;

    if (typeof options === 'undefined' || options === null) {
        throw new Error('init(): cannot initialize without options')
    } else if (typeof options.count === 'undefined' || options.count <= 0) {
        throw new Error('init(): options must include :count: parameter and count must be > 0')
    }

    _options = options;

    _pixelData = new Uint32Array(_options.count);

    bindings.init(_options);

    console.log('initialized');
};

/**
 * show data on the LED-strip.
 */
ws281x.show = function () {
    verifyInitialization();

    render();
};

/**
 * clears all LEDs, resets the PWM and DMA-parts and deallocates
 * all internal structures.
 */
ws281x.reset = function () {
    verifyInitialization();

    bindings.reset();
};

/**
 * set the overall-brightness for the entire strip.
 * This is a fixed scaling applied by the driver when
 * data is sent to the strip
 *
 * @param {Number} brightness value from 0 to 100.
 */
ws281x.setBrightness = function (brightness) {
    verifyInitialization();

    if (typeof brightness === 'undefined' || brightness === null || brightness < 0 || brightness > 100) {
        throw new Error('setBrightness(): you need to pass between 0 and 100')
    }

    bindings.setBrightness( 2.55 * brightness );
};

/**
 * Sets color for the pixel by position
 *
 * @param position
 * @param {r, g, b}
 */
ws281x.setPixelColor = function (position, {r, g, b}) {
    verifyInitialization();

    _pixelData[position] = rgb2Int(r, g, b);
};

/**
 * Sets one color for the whole strip
 * @param {r, g, b}
 */
ws281x.setAllColor = function ({r, g, b}) {
    verifyInitialization();

    for (let i = 0; i < _options.count; i++) {
        ws281x.setPixelColor(i, {r, g, b});
    }
};

/**
 * Retrieves color at given pixel position
 * @param position
 */
ws281x.getPixelColor = function (position) {
    verifyInitialization();

    this.emit('getPixelColor', _pixelData[position]);
};

function verifyInitialization() {
    if(!_isInitialized) {
        throw new Error('called before initialization.');
    }
}

function render() {
    bindings.render(_pixelData);
}

function rgb2Int(r, g, b) {
    return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

module.exports = ws281x;
