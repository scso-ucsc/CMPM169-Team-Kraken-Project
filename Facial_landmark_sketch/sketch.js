let img; // p5.Image for drawing
let imgElement; // HTML <img> element for face detection
let photo;
let phoneWidth = 360;  // width
let phoneHeight = 640; // height
let scaleValue = 6;
let fileInput;
let detections; // Store face detection results

const featureWords = {
  leftJaw: { indices: [0, 1, 2, 3], label: "SCAR" }, // Left side of the jaw
  rightJaw: { indices: [13, 14, 15, 16], label: "FAT" }, // Right side of the jaw
  chin: { indices: [6, 7, 8, 9, 10, 54, 48], label: "UGLY" }, // Center bottom point of the jaw
  leftCheekbone: { indices: [0, 27, 29, 2], label: "GROSS" }, // Left cheekbone
  rightCheekbone: { indices: [14, 16, 27, 29], label: "WRINKLED" }, // Right cheekbone
  leftCheek: { indices: [2, 3, 4, 5, 6, 48, 52, 35, 29], label: "UNFIT" }, // Left cheek
  rightCheek: { indices: [10, 11, 12, 13, 14, 29, 31, 50, 55], label: "ACNE" }, // Right cheek
  nose: { indices: [31, 21, 22, 35], label: "RoUND" }, // Nose
  // philitrum: { indices: [50, 52, 34, 32], label: "PHILITRUM" }, // Philitrum
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


function setup() {
  let canvas = createCanvas(phoneWidth, phoneHeight);
  canvas.parent('canvas-container');

  // Retrieve the image data from local storage
  let imageData = localStorage.getItem('uploadedImage');
  if (imageData) {
    img = loadImage(imageData, () => {
      img.resize(phoneWidth, phoneHeight);
      console.log('Image loaded in the filter sketch');
    });
  }

  // Load face-api.js models
  loadModels();

  setupUI();
}

function draw() {
  background(255);

  if (img) {
    // Display the image
    image(img, 0, 0, phoneWidth, phoneHeight);

    // Apply the filter (e.g., grayscale or color)
    if (currentFilter === 'grayscale') {
      filter(GRAY);
    } else if (currentFilter === 'color') {
      // Apply color filter logic here
    }
  }
}
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  console.log('Models loaded');
}

function draw() {
  background(255);

  if (photo) {
    // Word-based mode
    displayWordPhoto();
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
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = null; //Resetting variables
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

function displayWordPhoto() {
  background(0);
  photo.loadPixels();

  if (detections && detections.length > 0) {
    const landmarks = detections[0].landmarks;
    const headPolygon = getHeadPolygon(landmarks, 30); // Add 30px padding

    for (let [key, { indices, label }] of Object.entries(featureWords)) {     // Draw words for each facial feature
      fillFeatureWithWords(landmarks, indices, label);
    }
  }
}

function fillFeatureWithWords(landmarks, indices, label) {
  let minX = Infinity, minY = Infinity; // Get the bounding box of the feature
  let maxX = -Infinity, maxY = -Infinity;
  for (let i of indices) {
    const point = landmarks.positions[i];
    minX = min(minX, point._x);
    minY = min(minY, point._y);
    maxX = max(maxX, point._x);
    maxY = max(maxY, point._y);
  }

  let boxWidth = maxX - minX;
  let boxHeight = maxY - minY;

  let featureSize = max(boxWidth, boxHeight);
  let textSizeFactor = featureSize / 10;

  textSizeFactor = min(textSizeFactor, 10);
  textSize(textSizeFactor);

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
          drawWordAtPoint(x, y, label, landmarks, indices);
          prev_word_start = x;
        }
      }
    }
    prev_word_start = 0;
  }
}


function drawWordAtPoint(x, y, label, landmarks, indices) {
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

function rgbToHsl(r, g, b) { //Calculations determined by consulting with ChatGPT
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // Achromatic
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

function hslToRgb(h, s, l) { //Calculations determined by consulting with ChatGPT
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
    return polygon; // Return an empty polygon if imgElement is null
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
    // Scale and translate the polygon points to match the image
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
    // Scale the landmark coordinates to match the photo resolution
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