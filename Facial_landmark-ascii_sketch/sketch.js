let asciiChar = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,^`'.                                 ";

let img; // p5.Image for drawing
let imgElement; // HTML <img> element for face detection
let photo;
let phoneWidth = 360;
let phoneHeight = 640;
let scaleValue = 10;

// Landmark labels
const landmarkLabels = {
  jawline: { indices: Array.from({ length: 17 }, (_, i) => i), label: "JAWLINE", color: [255, 0, 0] }, // Points 0–16 (red)
  nose: { indices: Array.from({ length: 9 }, (_, i) => i + 27), label: "NOSE", color: [0, 255, 0] }, // Points 27–35 (green)
  leftEye: { indices: Array.from({ length: 6 }, (_, i) => i + 36), label: "LEFTEYE", color: [0, 0, 255] }, // Points 36–41 (blue)
  rightEye: { indices: Array.from({ length: 6 }, (_, i) => i + 42), label: "RIGHTEYE", color: [255, 255, 0] }, // Points 42–47 (yellow)
  mouth: { indices: Array.from({ length: 20 }, (_, i) => i + 48), label: "MOUTH", color: [255, 0, 255] }, // Points 48–67 (magenta)
};

let detections; // Store face detection results

function setup() {
  createCanvas(phoneWidth, phoneHeight);

  // Create a file input for uploading images
  let fileInput = createFileInput(handleFile);
  fileInput.position(10, 10);

  fill(255);
  textSize(scaleValue);
  textAlign(CENTER, CENTER);

  // Load face-api.js models
  loadModels();
}

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  console.log('Models loaded');
}

function draw() {
  background(255);

  if (photo) {
    // ASCII mode
    displayASCIIPhoto();
    if (detections) {
      overlayLandmarkLabels();
    }
  } else if (img) {
    // Normal mode
    image(img, 0, 0, phoneWidth, phoneHeight);

    if (detections) {
      // Calculate scaling factors
      const scaleX = phoneWidth / imgElement.width;
      const scaleY = phoneHeight / imgElement.height;

      console.log('Scaling factors:', scaleX, scaleY); // Debugging

      for (let detection of detections) {
        // Draw the facial landmarks
        const landmarks = detection.landmarks;
        noStroke();
        fill(255, 0, 0); // Red color for dots
        for (let point of landmarks.positions) {
          let x = point._x * scaleX;
          let y = point._y * scaleY;
          console.log('Landmark position:', x, y); // Debugging
          ellipse(x, y, 5, 5); // Draw a small circle at each landmark
        }
      }
    }
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      console.log('Image loaded');

      img.resize(phoneWidth, phoneHeight);
      console.log('Resized image dimensions:', img.width, img.height); // Debugging

      // Create a cropped and resized version for ASCII conversion
      photo = img.get();
      photo.resize(phoneWidth / scaleValue, phoneHeight / scaleValue);
    });

    // Use createImg() for face-api.js
    imgElement = createImg(file.data, ''); // Create an HTML <img> element
    imgElement.hide();

    imgElement.elt.onload = () => {
      console.log('HTML image element loaded');
      detectFaces(imgElement.elt); // Pass the HTML element to face-api.js
    };
  } else {
    console.log('Please upload an image file.');
  }
}

async function detectFaces(imgElement) {
  if (imgElement) {
    detections = await faceapi.detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    console.log('Detections:', detections);
  }
}

function keyPressed() {
  if (key === " " && img && !photo) {
    photo = img.get();
    photo.resize(phoneWidth / scaleValue, phoneHeight / scaleValue); // Shrink the photo for ASCII processing
  } else if (key === " " && photo) {
    photo = null;
  }
}

function displayASCIIPhoto() {
  background(0);
  photo.loadPixels();
  for (let i = 0; i < photo.width; i++) {
    for (let j = 0; j < photo.height; j++) {
      let pixelIndex = (i + j * photo.width) * 4;
      let r = photo.pixels[pixelIndex + 0];
      let g = photo.pixels[pixelIndex + 1];
      let b = photo.pixels[pixelIndex + 2];

      let bright = (r + g + b) / 3;
      let tIndex = floor(map(bright, 0, 255, 0, asciiChar.length));

      let t = asciiChar.charAt(tIndex);

      let x = i * scaleValue + scaleValue / 2;
      let y = j * scaleValue + scaleValue / 2;

      text(t, x, y);
    }
  }
}

function overlayLandmarkLabels() {
  const scaleX = phoneWidth / imgElement.width;
  const scaleY = phoneHeight / imgElement.height;

  for (let detection of detections) {
    const landmarks = detection.landmarks;

    noStroke();
    textSize(12); // Smaller text size for labels
    textAlign(CENTER, CENTER);

    for (let [key, { indices, label, color }] of Object.entries(landmarkLabels)) {
      fill(color);
      let labelLetters = label.split(''); // Split label into individual letters
      let letterIndex = 0;

      for (let i = 0; i < indices.length - 1; i++) {
        const startPoint = landmarks.positions[indices[i]];
        const endPoint = landmarks.positions[indices[i + 1]];

        // Convert landmark positions to grid coordinates
        let startX = floor((startPoint._x * scaleX) / scaleValue);
        let startY = floor((startPoint._y * scaleY) / scaleValue);
        let endX = floor((endPoint._x * scaleX) / scaleValue);
        let endY = floor((endPoint._y * scaleY) / scaleValue);

        // Interpolate between start and end points
        let steps = max(abs(endX - startX), abs(endY - startY));
        for (let t = 0; t <= steps; t++) {
          let x = floor(lerp(startX, endX, t / steps));
          let y = floor(lerp(startY, endY, t / steps));

          // Place the next letter in the label
          if (x >= 0 && x < photo.width && y >= 0 && y < photo.height) {
            // Erase the ASCII character at this position
            fill(0); // Use the background color (black)
            noStroke();
            rect(
              x * scaleValue,
              y * scaleValue,
              scaleValue,
              scaleValue 
            );

            fill(color);
            let letter = labelLetters[letterIndex % labelLetters.length];
            text(letter, x * scaleValue + scaleValue / 2, y * scaleValue + scaleValue / 2);
            letterIndex++;
          }
        }
      }
    }
  }

  // Reset fill color
  fill(255, 255, 255);
}