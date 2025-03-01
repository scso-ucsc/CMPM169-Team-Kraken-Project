let img;
let detections;
let fileInput;

function setup() {
  createCanvas(640, 480);

  // Create a file input for uploading images
  fileInput = createFileInput(handleFile);
  fileInput.position(10, 10);

  // Load face-api.js models
  loadModels();
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
    // Display the uploaded image
    image(img, 0, 0, width, height);

    if (detections) {
      // Calculate scaling factors
      const scaleX = width / img.width;
      const scaleY = height / img.height;

      for (let detection of detections) {
        // Draw the bounding box
        const box = detection.detection.box;
        // console.log('Bounding box (original):', box);
        noFill();
        stroke(0, 255, 0);
        strokeWeight(2);
        rect(box.x * scaleX, box.y * scaleY, box.width * scaleX, box.height * scaleY);

        // Draw the facial landmarks
        const landmarks = detection.landmarks;
        noStroke();
        fill(255, 0, 0);
        for (let point of landmarks.positions) {
          ellipse(point._x * scaleX, point._y * scaleY, 5, 5);
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
  }
}

async function detectFaces() {
  if (img) {
    detections = await faceapi.detectAllFaces(img.elt, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
  }
}