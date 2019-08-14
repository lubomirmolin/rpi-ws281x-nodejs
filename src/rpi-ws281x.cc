#include <nan.h>

#include <v8.h>

#include <stdio.h>
#include <stdint.h>
#include <string.h>

#include <algorithm>

extern "C" {
   #include "rpi_ws281x/ws2811.h"
}

using namespace v8;

#define TARGET_FREQ             WS2811_TARGET_FREQ
#define GPIO_PIN                18
#define DMA                     10
#define STRIP_TYPE              WS2811_STRIP_RGB

ws2811_t ledstring;
ws2811_channel_t
  channel0data,
  channel1data;

void reset(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  memset(ledstring.channel[0].leds, 0, sizeof(*ledstring.channel[0].leds) * ledstring.channel[0].count);

  ws2811_render(&ledstring);
  ws2811_wait(&ledstring);
  ws2811_fini(&ledstring);

  info.GetReturnValue().SetUndefined();
}

void setBrightness(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if(info.Length() != 1) {
      return Nan::ThrowError("setBrightness(): no value given");
  }

  // first argument is a number
  if(!info[0]->IsNumber()) {
    return Nan::ThrowTypeError("setBrightness(): argument 0 is not a number");
  }

  ledstring.channel[0].brightness = info[0]->Int32Value();

  info.GetReturnValue().SetUndefined();
}

void render(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if(info.Length() != 1) {
    Nan::ThrowTypeError("render(): missing argument.");
    return;
  }

  if(!node::Buffer::HasInstance(info[0])) {
    Nan::ThrowTypeError("render(): expected argument to be a Buffer.");
    return;
  }

  Local<Object> buffer = info[0]->ToObject();

  int numBytes = std::min((int)node::Buffer::Length(buffer),
      4 * ledstring.channel[0].count);

  uint32_t* data = (uint32_t*) node::Buffer::Data(buffer);
  memcpy(ledstring.channel[0].leds, data, numBytes);

  ws2811_return_t ret;

  if ((ret = ws2811_render(&ledstring)) != WS2811_SUCCESS) {
    Nan::ThrowTypeError("render(): not working");
  }

  info.GetReturnValue().SetUndefined();
}

void init(const Nan::FunctionCallbackInfo<v8::Value>& info) {

    if (!info[0]->IsObject()) {
        Nan::ThrowTypeError("init(): argument must be an object type");
    }

    ledstring.freq    = TARGET_FREQ;
    ledstring.dmanum  = DMA;

    channel0data.gpionum = GPIO_PIN;
    channel0data.invert = 0;
    channel0data.count = 10;
    channel0data.brightness = 255;
    channel0data.strip_type = STRIP_TYPE;

    Local<Object> config = info[0]->ToObject();

    Local<String>
        symCount = Nan::New<String>("count").ToLocalChecked(),
        symFreq = Nan::New<String>("frequency").ToLocalChecked(),
        symDmaNum = Nan::New<String>("dmaNum").ToLocalChecked(),
        symGpioPin = Nan::New<String>("gpioPin").ToLocalChecked(),
        symInvert = Nan::New<String>("invert").ToLocalChecked(),
        symBrightness = Nan::New<String>("brightness").ToLocalChecked(),
        symStripType = Nan::New<String>("stripType").ToLocalChecked();

    if(Nan::HasOwnProperty(config, symFreq).FromMaybe(false)) {
      ledstring.freq = config->Get(symFreq)->Uint32Value();
    }

    if(Nan::HasOwnProperty(config, symDmaNum).FromMaybe(false)) {
      ledstring.dmanum = config->Get(symDmaNum)->Int32Value();
    }

    if(Nan::HasOwnProperty(config, symCount).FromMaybe(false)) {
      channel0data.count = config->Get(symCount)->Int32Value();
    }

    if(Nan::HasOwnProperty(config, symGpioPin).FromMaybe(false)) {
      channel0data.gpionum = config->Get(symGpioPin)->Int32Value();
    }

    if(Nan::HasOwnProperty(config, symStripType).FromMaybe(false)) {
      channel0data.strip_type = config->Get(symStripType)->Int32Value();
    }

    if(Nan::HasOwnProperty(config, symInvert).FromMaybe(false)) {
      channel0data.invert = config->Get(symInvert)->Int32Value();
    }

    if(Nan::HasOwnProperty(config, symBrightness).FromMaybe(false)) {
      channel0data.brightness = 2.55 * config->Get(symBrightness)->Int32Value();
    }

    ledstring.channel[0] = channel0data;
    ledstring.channel[1] = channel1data;

    ws2811_return_t ret;

    if ((ret = ws2811_init(&ledstring)) != WS2811_SUCCESS)
    {
        Nan::ThrowTypeError("init(): ws2811_init ended with error");
    }

    info.GetReturnValue().SetUndefined();
}

void initialize(v8::Local<v8::Object> exports) {
    exports->Set(Nan::New("reset").ToLocalChecked(), Nan::New<v8::FunctionTemplate>(reset)->GetFunction());
    exports->Set(Nan::New("setBrightness").ToLocalChecked(), Nan::New<v8::FunctionTemplate>(setBrightness)->GetFunction());
    exports->Set(Nan::New("render").ToLocalChecked(), Nan::New<v8::FunctionTemplate>(render)->GetFunction());
    exports->Set(Nan::New("init").ToLocalChecked(), Nan::New<v8::FunctionTemplate>(init)->GetFunction());
}

NODE_MODULE(rpi_ws281x, initialize)
