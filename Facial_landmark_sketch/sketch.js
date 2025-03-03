let img;
let detections;
let fileInput;
const canvasWidth = 840;
const canvasHeight = 680;

function setup() {
  createCanvas(canvasWidth, canvasHeight).parent('canvas-container');

  // Create a file input for uploading images
  fileInput = createFileInput(handleFile);
  fileInput.hide(); 

  // Load face-api.js models
  loadModels();
  setupUI();
}

async function loadModels() {
  // Use the original model URLs from the face-api.js repository
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
  console.log('Models loaded');
}

function draw() {
  background(255);

  if (img) {
    // get original image dimensions
    let imgWidth = img.width;
    let imgHeight = img.height;

    // determines best scale while maintaining aspect ratio
    let scale = min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    
    let newWidth = imgWidth * scale;
    let newHeight = imgHeight * scale;

    // centers image
    let xOffset = (canvasWidth - newWidth) / 2;
    let yOffset = (canvasHeight - newHeight) / 2;

    // Display the uploaded image
    image(img, xOffset, yOffset, newWidth, newHeight);

    // Calculate scaling factors
    if (detections) {
      for (let detection of detections) {
        // Draw the bounding box
        const box = detection.detection.box;
        // console.log('Bounding box (original):', box);
        noFill();
        stroke(0, 255, 0);
        strokeWeight(2);
        rect(
          box.x * scale + xOffset,
          box.y * scale + yOffset,
          box.width * scale,
          box.height * scale
        );

        // Draw the facial landmarks
        const landmarks = detection.landmarks;
        noStroke();
        fill(255, 0, 0);
        for (let point of landmarks.positions) {
          ellipse(point._x * scale + xOffset, point._y * scale + yOffset, 5, 5);
        }
      }
    }
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = createImg(file.data, ''); // Load the uploaded image
    img.hide(); // Hide the HTML image element
    detectFaces(); // Detect faces in the uploaded image
  } else {
    console.log('Please upload an image file.');
    showErrorMessage('Invalid file. Please upload an image.');
  }
}

async function detectFaces() {
  if (img) {
    detections = await faceapi.detectAllFaces(img.elt, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detections || detections.length === 0) {
      showErrorMessage('No face detected. Please try another image.');
    } else {
      hideErrorMessage();
    }
  }
}
