let asciiChar = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,^'.                                 "

let video;
let photo;
let phoneWidth = 360;
let phoneHeight = 640;
let scaleValue = 10;

var streamReady = false;
let faceMesh;
let faces = [];

function preload(){
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
}

function setup() {
  createCanvas(360, 640);
  video = createCapture(VIDEO, {flipped: true}, function() {
    streamReady = true;
  });
  video.size(640, 480);
  video.hide();
  
  fill(255);
  textSize(scaleValue);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(0);

  if(photo){
    displayASCIIPhoto();
    drawFaceResults();
  } else if(streamReady){
    displayVideoFeed();
  }
}

function keyPressed(){
  if(key === " " && !photo){
    let videoAspect = video.width / video.height;
    let phoneAspect = phoneWidth / phoneHeight;
    
    let cropX = 0;
    let cropY = 0;
    let cropWidth = video.width;
    let cropHeight = video.height;
    
    if(videoAspect > phoneAspect){
      cropWidth = video.height * phoneAspect;
      cropX = (video.width - cropWidth) / 2;
    } else{
      cropHeight = video.width * phoneAspect;
      cropY = (video.height - cropHeight) / 2;
    }
    
    photo = video.get(cropX, cropY, cropWidth, cropHeight);
    photo.resize(phoneWidth / scaleValue, phoneHeight / scaleValue); //Shrinking captured photo to reduce amount of processing needed
    
    faceMesh.detect(photo, gotFaces);
  } else if(key === " " && photo){
    photo = null;
    faces = [];
  }
}

function displayASCIIPhoto(){
  background(0);
  photo.loadPixels();
  for (let i = 0; i < photo.width; i++) {
    for (let j = 0; j < photo.height; j++) {
      let pixelIndex = (i + j * photo.width) * 4;
      let r = photo.pixels[pixelIndex + 0];
      let g = photo.pixels[pixelIndex + 1];
      let b = photo.pixels[pixelIndex + 2];

      let bright = (r + g + b) / 3; //Calculating brightness to determine which character use
      let tIndex = floor(map(bright, 0, 255, 0, asciiChar.length));

      let t = asciiChar.charAt(tIndex);

      let x = i * scaleValue + scaleValue / 2; //Calculating position on canvas
      let y = j * scaleValue + scaleValue / 2;

      text(t, x, y);
    }
  }
}

function displayVideoFeed(){
  let videoAspect = video.width / video.height;
  let phoneAspect = phoneWidth / phoneHeight;

  let cropX = 0;
  let cropY = 0;
  let cropWidth = video.width;
  let cropHeight = video.height;

  if(videoAspect > phoneAspect){ //Cropping input video to phone camera dimensions
    cropWidth = video.height * phoneAspect;
    cropX = (video.width - cropWidth) / 2;
  } else{
    cropHeight = video.width * phoneAspect;
    cropY = (video.height - cropHeight) / 2;
  }

  image(video, 0, 0, phoneWidth, phoneHeight, cropX, cropY, cropWidth, cropHeight);
}

function drawFaceResults(){
  if (faces.length > 0) {
    let face = faces[0];
    console.log(face);
    
    let scaleFactor = phoneWidth / scaleValue / photo.width;
    for (let i = 0; i < face.keypoints.length; i++) {
      let keypoint = face.keypoints[i];
      
      let x = (photo.width - keypoint.x) * scaleFactor;
      let y = keypoint.y * scaleFactor;
      
      let asciiX = x * scaleValue;
      let asciiY = y * scaleValue;
      
      push();
      stroke(255, 255, 0);
      strokeWeight(4);
      point(asciiX, asciiY);
      pop();
    }
  }
}

function gotFaces(results) {
  faces = results;
}