let chooseImageButton;
let statusMessage;

function setupUI() {
  // centered button
  chooseImageButton = createButton('Choose Image');
  chooseImageButton.parent('button-container');  // appends the button to the correct container
  chooseImageButton.mousePressed(() => fileInput.elt.click());

  // status message (error handling)
  statusMessage = createP('');
  statusMessage.parent('message-container'); // appends the button to the correct container
  statusMessage.style('color', 'red');
  statusMessage.hide();
}

function showErrorMessage(message) {
  statusMessage.html(message);
  statusMessage.show();
}

function hideErrorMessage() {
  statusMessage.hide();
}