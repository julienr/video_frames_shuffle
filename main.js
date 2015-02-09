// JS datastructure libraries :
// https://github.com/monmohan/dsjslib
// https://github.com/mauriciosantos/buckets

// Video manipulation stuff :
// http://www.kaizou.org/2012/09/frame-by-frame-video-effects-using-html5-and/
// http://www.kaizou.org/code/video/frameGrabber.js

// memorySizeS is the length of the memory in seconds
function FrameGrabber(video, targetWidth, targetHeight, framerate, memorySizeS) {
  this.video = video;
  this.framerate = framerate;
  this.MEMORY_SIZE = Math.round(framerate * memorySizeS);
  console.log('Memory of ' + this.MEMORY_SIZE + ' frames');
  this.memory = [];

  // Create a framebuffer canvas to capture frames
  this.width = targetWidth
  this.height = targetHeight;
  this.framebuffer = document.createElement("canvas");
  this.framebuffer.width = this.width;
  this.framebuffer.height = this.height;
  this.fb_ctx = this.framebuffer.getContext("2d");

  var self = this;
  var interval = null;

  var lastCapturedFrame = -1;

  // Event listener setup
  this.video.addEventListener("play", function() {
    // Capture at double framerate so as to not miss frames
    interval = setInterval(function() {
      self.think();
    }, 1000 / (2 * framerate));
  });

  this.stop = function() {
    clearInterval(interval);
  };

  // Member functions
  this.think = function() {
    if (self.video.paused || self.video.ended) {
      stop();
    }

    var frame = self.currentFrame();
    if (frame != lastCapturedFrame) {
      var data = self.acquireFrame();
      //console.log('acquired frame : ', data);
      self.memory.push(data);

      while (self.memory.length > self.MEMORY_SIZE) {
        self.memory.shift();
      }
    }
    //console.log('thinking, currentFrame : ' + self.currentFrame()
                //+ ", memory size : " + self.memory.length);
  };

  this.currentFrame = function() {
    return Math.floor(self.video.currentTime.toFixed(5) * self.framerate);
  };

  this.acquireFrame = function() {
    self.fb_ctx.drawImage(self.video, 0, 0, self.video.videoWidth,
        self.video.videoHeight, 0, 0, self.width, self.height);
    return self.fb_ctx.getImageData(0, 0, self.width, self.height);
  };
};

function FrameShuffler(video, canvas, framerate, frameGrabber) {
  this.video = video;
  this.canvas = canvas;
  this.grabber = frameGrabber;

  this.canvas_ctx = canvas.getContext("2d");

  var self = this;
  var interval = null;

  // Event listener setup
  this.video.addEventListener("play", function() {
    interval = setInterval(function() {
      self.render();
    }, 1000 / framerate);
  }, false);

  this.stop = function() {
    clearInterval(interval);
  };

  // Member functions
  this.render = function() {
    if (self.video.paused || self.video.ended) {
      stop();
      return;
    }
    self.renderFrame();
  }

  this.renderFrame = function() {
    if (self.grabber.memory.length > 0) {
      var idx = _.random(0, self.grabber.memory.length - 1);
      var data = self.grabber.memory[idx];
      self.canvas_ctx.putImageData(data, 0, 0);
      self.grabber.memory.splice(idx, 1);
    }
  };

};

var video = document.getElementById("video");
var canvas = document.getElementById("canvas");

var FRAMERATE = 25.0;

var frameGrabber = null;
var frameShuffle = null;

var history_size_secs = 1.0;
if (window.location.hash) {
  var hashfloat = parseFloat(window.location.hash.split('#')[1]);
  if (!isNaN(hashfloat)) {
    history_size_secs = hashfloat;
  }
}
console.log('using history size ' + history_size_secs);

document.getElementById("winsize").innerHTML = "" + history_size_secs;

if (frameGrabber != null) {
  frameGrabber.stop();
  frameShuffle.stop();
}
var frameGrabber = new FrameGrabber(video, canvas.width, canvas.height,
    FRAMERATE, history_size_secs);
var frameShuffler = new FrameShuffler(video, canvas, FRAMERATE, frameGrabber);
