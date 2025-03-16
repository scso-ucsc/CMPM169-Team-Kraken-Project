let img; // p5.Image for drawing
let imgElement; // HTML <img> element for face detection
let photo;
let phoneWidth = 840;  // width
let phoneHeight = 680; // height
let scaleValue = 7;
let fileInput;

// Words to describe facial features
const featureWords = {
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
  leftEyelid: { indices: [17, 21, 39, 38, 37, 36], label: "LID" }, // Eyelid
  rightEyelid: { indices: [22, 26, 45, 44, 43, 42], label: "LID" }, // Eyelid
  topLip: { indices: [48, 49, 50, 51, 52, 53, 54, 63, 62, 61], label: "LIPS" }, // Lips
  bottomLip: { indices: [60, 59, 58, 57, 56, 55, 54, 65, 66, 67], label: "LIPS" }, // Lips
};

let detections; // Store face detection results

function setup() {
  let canvas = createCanvas(phoneWidth, phoneHeight);
  canvas.parent('canvas-container');

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
        // Draw the facial landmarks
        const landmarks = detection.landmarks;
        noStroke();
        fill(255, 0, 0); // Red color for dots
        for (let point of landmarks.positions) {
          let x = point._x * scaleX + xOffset;
          let y = point._y * scaleY + yOffset;
          ellipse(x, y, 5, 5); // Draw a small circle at each landmark
          text(i, x + 15, y);
          i++;
        }

        // Draw the outlines of the facial feature polygons
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
    img = loadImage(file.data, () => {
      img.resize(phoneWidth, phoneHeight);
      // Create a cropped and resized version for processing
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
    console.log('Detections:', detections);
  }
}

function keyPressed() {
  if (key === " " && img && !photo) {
    photo = img.get();
    photo.resize(phoneWidth / scaleValue, phoneHeight / scaleValue); // Shrink the photo for processing
  } else if (key === " " && photo) {
    photo = null;
  }
}

function displayWordPhoto() {
  background(0);
  photo.loadPixels();

  if (detections && detections.length > 0) {
    const landmarks = detections[0].landmarks;
    const headPolygon = getHeadPolygon(landmarks, 30); // Add 30px padding

    // Draw words for each facial feature
    for (let [key, { indices, label }] of Object.entries(featureWords)) {
      fillFeatureWithWords(landmarks, indices, label);
    }
  }
}
function fillFeatureWithWords(landmarks, indices, label) {
  // Get the bounding box of the feature
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (let i of indices) {
    const point = landmarks.positions[i];
    minX = min(minX, point._x);
    minY = min(minY, point._y);
    maxX = max(maxX, point._x);
    maxY = max(maxY, point._y);
  }

  // Convert bounding box to grid coordinates
  minX = floor((minX / imgElement.width) * photo.width);
  minY = floor((minY / imgElement.height) * photo.height);
  maxX = floor((maxX / imgElement.width) * photo.width);
  maxY = floor((maxY / imgElement.height) * photo.height);

  let label_length = label.length;
  let prev_word_start = -1;

  // Fill the re gion with words
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

function getFeaturePolygon(landmarks, indices) {
  const polygon = [];
  if (!imgElement) {
    console.error("imgElement is null. Cannot calculate polygon.");
    return polygon; // Return an empty polygon if imgElement is null
  }

  // Use photo if available, otherwise use img
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
  stroke(color); // Green color for the polygon outlines
  strokeWeight(2); // Thickness of the outline
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
  const jawline = landmarks.getJawOutline(); // Points 0–16
  const eyebrows = landmarks.getLeftEyeBrow().concat(landmarks.getRightEyeBrow()); // Points 17–26

  // Find the top of the eyebrows (minimum y-value)
  let minY = Infinity;
  eyebrows.forEach(point => {
    if (point.y < minY) minY = point.y;
  });

  // Add padding above the eyebrows to include forehead and hair
  const paddedMinY = minY - padding;

  // Create the polygon
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