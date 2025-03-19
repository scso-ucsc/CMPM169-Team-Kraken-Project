let video;
let streamReady = false;
let img; // p5.Image for drawing
let imgElement; // HTML <img> element for face detection
let photo;
let phoneWidth = 360;  // width
let phoneHeight = 640; // height
let scaleValue = 6;
let fileInput;
let detections; // Store face detection results
let currentFilter = 'normal'; // 'normal', 'grayscale', 'color'

// Words to describe facial features
const colorFeatureWords = {
  leftJaw: { indices: [0, 1, 2, 3], label: "SCAR" }, // Left side of the jaw
  rightJaw: { indices: [13, 14, 15, 16], label: "FAT" }, // Right side of the jaw
  chin: { indices: [6, 7, 8, 9, 10, 54, 48], label: "UGLY" }, // Center bottom point of the jaw
  leftCheekbone: { indices: [0, 27, 29, 2], label: "GROSS" }, // Left cheekbone
  rightCheekbone: { indices: [14, 16, 27, 29], label: "WRINKLED" }, // Right cheekbone
  leftCheek: { indices: [2, 3, 4, 5, 6, 48, 52, 35, 29], label: "UNFIT" }, // Left cheek
  rightCheek: { indices: [10, 11, 12, 13, 14, 29, 31, 50, 55], label: "ACNE" }, // Right cheek
  nose: { indices: [31, 21, 22, 35], label: "RoUND" }, // Nose
  bridge: { indices: [29, 21, 22], label: "DOTS" }, // Bridge of the nose
  leftNostril: { indices: [31], label: "HAIRY" }, // Nostril
  rightNostril: { indices: [34], label: "LARGE" }, // Nostril
  leftEyebrow: { indices: [17, 18, 19, 20, 21], label: "SWEATY" }, // Eyebrow
  rightEyebrow: { indices: [22, 23, 24, 25, 26], label: "DUMB" }, // Eyebrow
  leftTemple: { indices: [0, 17, 41, 1], label: "STUPID" }, // Temple
  rightTemple: { indices: [26, 16, 15, 46], label: "SCARY" }, // Temple
  leftEye: { indices: [36, 37, 38, 39, 40, 41], label: "ROUND" }, // Eye
  rightEye: { indices: [42, 43, 44, 45, 46, 47], label: "SMALL" }, // Eye
  leftEyelid: { indices: [17, 21, 27, 39, 38, 37, 36], label: "BRUISED" }, // Eyelid
  rightEyelid: { indices: [22, 26, 45, 44, 43, 42, 27], label: "FAT" }, // Eyelid
  topLip: { indices: [48, 49, 50, 51, 52, 53, 54, 63, 62, 61], label: "FAT" }, // Lips
  bottomLip: { indices: [60, 59, 58, 57, 56, 55, 54, 65, 66, 67], label: "DRY" }, // Lips
};

const grayscaleFeatureWords = {
  leftJaw: { indices: [0, 1, 2, 3], label: "JAW" }, // Left side of the jaw
  rightJaw: { indices: [13, 14, 15, 16], label: "JAW" }, // Right side of the jaw
  chin: { indices: [6, 7, 8, 9, 10, 54, 48], label: "CHIN" }, // Center bottom point of the jaw
  leftCheekbone: { indices: [0, 27, 29, 2], label: "CHEEKBONE" }, // Left cheekbone
  rightCheekbone: { indices: [14, 16, 27, 29], label: "CHEEKBONE" }, // Right cheekbone
  leftCheek: { indices: [2, 3, 4, 5, 6, 48, 52, 35, 29], label: "CHEEK" }, // Left cheek
  rightCheek: { indices: [10, 11, 12, 13, 14, 29, 31, 50, 55], label: "CHEEK" }, // Right cheek
  nose: { indices: [31, 21, 22, 35], label: "NOSE" }, // Nose
  // philitrum: { indices: [50, 52, 34, 32], label: "PHILITRUM" }, // Philitrum
  bridge: { indices: [29, 21, 22], label: "BRIDGE" }, // Bridge of the nose
  leftNostril: { indices: [31], label: "NOSTRIL" }, // Nostril
  rightNostril: { indices: [34], label: "NOSTRIL" }, // Nostril
  leftEyebrow: { indices: [17, 18, 19, 20, 21], label: "BROW" }, // Eyebrow
  rightEyebrow: { indices: [22, 23, 24, 25, 26], label: "BROW" }, // Eyebrow
  leftTemple: { indices: [0, 17, 41, 1], label: "TEMPLE" }, // Temple
  rightTemple: { indices: [26, 16, 15, 46], label: "TEMPLE" }, // Temple
  leftEye: { indices: [36, 37, 38, 39, 40, 41], label: "EYE" }, // Eye
  rightEye: { indices: [42, 43, 44, 45, 46, 47], label: "EYE" }, // Eye
  leftEyelid: { indices: [17, 21, 27, 39, 38, 37, 36], label: "LID" }, // Eyelid
  rightEyelid: { indices: [22, 26, 45, 44, 43, 42, 27], label: "LID" }, // Eyelid
  topLip: { indices: [48, 49, 50, 51, 52, 53, 54, 63, 62, 61], label: "LIPS" }, // Lips
  bottomLip: { indices: [60, 59, 58, 57, 56, 55, 54, 65, 66, 67], label: "LIPS" }, // Lips
};

function setup() {
  let canvas = createCanvas(phoneWidth, phoneHeight);
  canvas.parent('canvas-container');

  video = createCapture(VIDEO, function() {
    streamReady = true;
  });
  video.size(640, 480);
  video.hide();

  // Create and hide file input
  fileInput = createFileInput(handleFile);
  fileInput.hide();

  fill(255);
  textSize(scaleValue);
  textAlign(CENTER, CENTER);

  // Load face-api.js models
  loadModels();
  
  setupUI();
}

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  console.log('Models loaded');
}

function draw() {
  background(255);

  if (photo) {
    if (currentFilter === 'normal') {
      displayNormalPhoto();
    } else if (currentFilter === 'grayscale') {
      displayGrayscalePhoto();
    } else if (currentFilter === 'color') {
      displayColorPhoto();
    }
  } else if (img) {
    // Normal mode
    let imgWidth = img.width;
    let imgHeight = img.height;

    // scaling factors
    let scale = min(phoneWidth / imgWidth, phoneHeight / imgHeight);
    let newWidth = imgWidth * scale;
    let newHeight = imgHeight * scale;

    let xOffset = (phoneWidth - newWidth) / 2;
    let yOffset = (phoneHeight - newHeight) / 2;

    image(img, xOffset, yOffset, newWidth, newHeight);

    if (detections) {
      const scaleX = newWidth / imgElement.width;
      const scaleY = newHeight / imgElement.height;
      let i = 0;
      for (let detection of detections) {
        const landmarks = detection.landmarks;
        noStroke();
        fill(255, 0, 0); // Red color for dots
        for (let point of landmarks.positions) {
          let x = point._x * scaleX + xOffset;
          let y = point._y * scaleY + yOffset;
          ellipse(x, y, 5, 5);
          text(i, x + 15, y);
          i++;
        }

        for (let [key, { indices, label }] of Object.entries(featureWords)) {
          const polygon = getFeaturePolygon(landmarks, indices);
          drawPolygon(polygon, scaleX, scaleY, xOffset, yOffset, color(random(255), random(255), random(255)));
        }
      }
    }
  } else if (streamReady) {
    displayVideoFeed();
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = null; // Resetting variables
    photo = null;
    detections = null;
    
    img = loadImage(file.data, () => {
      img.resize(phoneWidth, phoneHeight);
      photo = img.get();
      photo.resize(phoneWidth / scaleValue, phoneHeight / scaleValue);
    });

    // Use createImg() for face-api.js
    imgElement = createImg(file.data, ''); // Create an HTML <img> element
    imgElement.hide();

    imgElement.elt.onload = () => {
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
  }
}

function displayNormalPhoto() {
  image(img, 0, 0, phoneWidth, phoneHeight);
}

function displayGrayscalePhoto() {
  background(0);
  photo.loadPixels();

  if (detections && detections.length > 0) {
    const landmarks = detections[0].landmarks;
    for (let [key, { indices, label }] of Object.entries(grayscaleFeatureWords)) {
      fillFeatureWithWords(landmarks, indices, label, true); // Grayscale mode
    }
  }
}

function displayColorPhoto() {
  background(0);
  photo.loadPixels();

  if (detections && detections.length > 0) {
    const landmarks = detections[0].landmarks;
    for (let [key, { indices, label }] of Object.entries(colorFeatureWords)) {
      fillFeatureWithWords(landmarks, indices, label, false); // Color mode
    }
  }
}

function fillFeatureWithWords(landmarks, indices, label, isGrayscale) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (let i of indices) {
    const point = landmarks.positions[i];
    minX = min(minX, point._x);
    minY = min(minY, point._y);
    maxX = max(maxX, point._x);
    maxY = max(maxY, point._y);
  }

  minX = floor((minX / imgElement.width) * photo.width);
  minY = floor((minY / imgElement.height) * photo.height);
  maxX = floor((maxX / imgElement.width) * photo.width);
  maxY = floor((maxY / imgElement.height) * photo.height);

  let label_length = label.length;
  let prev_word_start = -1;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPolygon({ x, y }, getFeaturePolygon(landmarks, indices))) {
        if (x > prev_word_start + label_length - 1) {
          if (isGrayscale) {
            grayscaleDrawWordAtPoint(x, y, label, landmarks, indices);
          } else {
            colorDrawWordAtPoint(x, y, label, landmarks, indices);
          }
          prev_word_start = x;
        }
      }
    }
    prev_word_start = 0;
  }
}

function grayscaleDrawWordAtPoint(x, y, label, landmarks, indices) {
  textSize(scaleValue);
  // Check if the current position is within the photo bounds
  if (x >= 0 && x < photo.width && y >= 0 && y < photo.height) {
    // Split the label into individual letters
    const letters = label.split('');

    // Calculate the size of each grid cell
    const cellWidth = scaleValue; // Width of each cell
    const cellHeight = scaleValue; // Height of each cell

    // Iterate over each letter
    for (let i = 0; i < letters.length; i++) {
      // Calculate the position of the current letter within the grid
      const letterX = x * scaleValue + i * cellWidth + cellWidth / 2;
      const letterY = y * scaleValue + cellHeight / 2;

      // Calculate the pixel position in the photo for the current letter
      const pixelX = x + i; // Adjust for the letter's position in the word
      const pixelY = y;

      // Check if the pixel position is within the photo bounds and the head polygon
      if (pixelX >= 0 && pixelX < photo.width && pixelY >= 0 && pixelY < photo.height) {
        // Check if the current letter's position is within the head polygon
        if (!pointInPolygon({ x: pixelX, y: pixelY }, getFeaturePolygon(landmarks, indices))) {
          break; // Stop drawing further letters if outside the polygon
        }

        // Get the pixel brightness at the current letter's position
        let pixelIndex = (pixelX + pixelY * photo.width) * 4;
        let r = photo.pixels[pixelIndex + 0];
        let g = photo.pixels[pixelIndex + 1];
        let b = photo.pixels[pixelIndex + 2];
        let brightness = (r + g + b) / 3;

        // Draw a black box behind the letter
        fill(0); // Black color for the box
        noStroke();
        rectMode(CENTER);
        rect(letterX, letterY, cellWidth, cellHeight); // Draw the cell

        // Set the grayscale color based on brightness
        fill(brightness);
        noStroke();

        // Draw the letter at this position
        text(letters[i], letterX, letterY);
      } else {
        break; // Stop drawing further letters if outside the photo bounds
      }
    }
  }
}


function colorDrawWordAtPoint(x, y, label, landmarks, indices) {
  if (x >= 0 && x < photo.width && y >= 0 && y < photo.height) {
    const letters = label.split('');

    const cellWidth = scaleValue;
    const cellHeight = scaleValue;
    
    for (let i = 0; i < letters.length; i++) {
      const pixelX = x + i;
      const pixelY = y;

      if (pixelX >= 0 && pixelX < photo.width && pixelY >= 0 && pixelY < photo.height) {
        let pixelIndex = (pixelX + pixelY * photo.width) * 4;
        let r = photo.pixels[pixelIndex + 0];
        let g = photo.pixels[pixelIndex + 1];
        let b = photo.pixels[pixelIndex + 2];
        let a = photo.pixels[pixelIndex + 3];

        let brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;

        const jitterIntensity = map(brightness, 0, 1, -5, 5); // Mapping brightness to jitter intensity

        const jitterX = random(-jitterIntensity, jitterIntensity);
        const jitterY = random(-jitterIntensity, jitterIntensity);

        const letterX = x * scaleValue + i * cellWidth + cellWidth / 2 + jitterX;
        const letterY = y * scaleValue + cellHeight / 2 + jitterY;
        
        let maxTextSize = 15;
        let minTextSize = 5;
        let textSizeFactor = map(brightness, 0, 1, minTextSize, maxTextSize);
        textSize(textSizeFactor);

        let dullFactor = 0.5;
        let hsl = rgbToHsl(r, g, b);
        hsl.s *= dullFactor;
        let dullColor = hslToRgb(hsl.h, hsl.s, hsl.l);
        fill(dullColor[0], dullColor[1], dullColor[2], a);
        noStroke();
        
        text(letters[i], letterX, letterY);
      }
    }
  }
}

function drawWordAtPoint(x, y, label, landmarks, indices, isGrayscale) {
  if (x >= 0 && x < photo.width && y >= 0 && y < photo.height) {
    const letters = label.split('');
    const cellWidth = scaleValue;
    const cellHeight = scaleValue;

    for (let i = 0; i < letters.length; i++) {
      const pixelX = x + i;
      const pixelY = y;

      if (pixelX >= 0 && pixelX < photo.width && pixelY >= 0 && pixelY < photo.height) {
        let pixelIndex = (pixelX + pixelY * photo.width) * 4;
        let r = photo.pixels[pixelIndex + 0];
        let g = photo.pixels[pixelIndex + 1];
        let b = photo.pixels[pixelIndex + 2];
        let a = photo.pixels[pixelIndex + 3];

        let brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;

        const jitterIntensity = map(brightness, 0, 1, -5, 5);
        const jitterX = random(-jitterIntensity, jitterIntensity);
        const jitterY = random(-jitterIntensity, jitterIntensity);

        const letterX = x * scaleValue + i * cellWidth + cellWidth / 2 + jitterX;
        const letterY = y * scaleValue + cellHeight / 2 + jitterY;

        let maxTextSize = 15;
        let minTextSize = 5;
        let textSizeFactor = map(brightness, 0, 1, minTextSize, maxTextSize);
        textSize(textSizeFactor);

        if (isGrayscale) {
          // Grayscale mode: Scale brightness to 0–255
          fill(brightness * 255); // Corrected: brightness is now in the range 0–255
        } else {
          // Color mode
          let dullFactor = 0.5;
          let hsl = rgbToHsl(r, g, b);
          hsl.s *= dullFactor;
          let dullColor = hslToRgb(hsl.h, hsl.s, hsl.l);
          fill(dullColor[0], dullColor[1], dullColor[2], a);
        }
        noStroke();
        text(letters[i], letterX, letterY);
      }
    }
  }
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return { h: h * 360, s: s, l: l };
}

function hslToRgb(h, s, l) {
  let r, g, b;

  h /= 360;
  if (s === 0) {
    r = g = b = l;
  } else {
    let hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getFeaturePolygon(landmarks, indices) {
  const polygon = [];
  if (!imgElement) {
    console.error("imgElement is null. Cannot calculate polygon.");
    return polygon;
  }

  const width = photo ? photo.width : img.width;
  const height = photo ? photo.height : img.height;

  for (let i of indices) {
    const point = landmarks.positions[i];
    const scaledX = (point._x / imgElement.width) * width;
    const scaledY = (point._y / imgElement.height) * height;
    polygon.push({ x: scaledX, y: scaledY });
  }
  return polygon;
}

function drawPolygon(polygon, scaleX, scaleY, xOffset, yOffset, color) {
  noFill();
  stroke(color);
  strokeWeight(2);
  beginShape();
  for (let point of polygon) {
    let x = point.x;
    let y = point.y;
    vertex(x, y);
  }
  endShape(CLOSE);
}

function getHeadPolygon(landmarks, padding = 20) {
  const jawline = landmarks.getJawOutline();
  const eyebrows = landmarks.getLeftEyeBrow().concat(landmarks.getRightEyeBrow());

  let minY = Infinity;
  eyebrows.forEach(point => {
    if (point.y < minY) minY = point.y;
  });

  const paddedMinY = minY - padding;

  const polygon = [];
  jawline.forEach(point => {
    const scaledX = (point._x / imgElement.width) * photo.width;
    const scaledY = (point._y / imgElement.height) * photo.height;
    polygon.push({ x: scaledX, y: scaledY });
  });

  return polygon;
}

function pointInPolygon(point, polygon) {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].x, yi = polygon[i].y;
    let xj = polygon[j].x, yj = polygon[j].y;

    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function setupUI() {
  // let captureButton = createButton('Capture Photo');
  // captureButton.parent('button-container');
  // captureButton.mousePressed(capturePhoto);

  let uploadButton = createButton('Upload Image');
  uploadButton.parent('button-container');
  uploadButton.mousePressed(() => fileInput.elt.click());

  let normalButton = createButton('Normal');
  normalButton.parent('button-container');
  normalButton.mousePressed(() => currentFilter = 'normal');

  let grayscaleButton = createButton('Grayscale');
  grayscaleButton.parent('button-container');
  grayscaleButton.mousePressed(() => currentFilter = 'grayscale');

  let colorButton = createButton('Color');
  colorButton.parent('button-container');
  colorButton.mousePressed(() => currentFilter = 'color');
}

function capturePhoto() {
  let videoAspect = video.width / video.height;
  let phoneAspect = phoneWidth / phoneHeight;

  let cropX = 0;
  let cropY = 0;
  let cropWidth = video.width;
  let cropHeight = video.height;

  if (videoAspect > phoneAspect) {
    cropWidth = video.height * phoneAspect;
    cropX = (video.width - cropWidth) / 2;
  } else {
    cropHeight = video.width * phoneAspect;
    cropY = (video.height - cropHeight) / 2;
  }

  photo = video.get(cropX, cropY, cropWidth, cropHeight);
  photo.resize(phoneWidth / scaleValue, phoneHeight / scaleValue);
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