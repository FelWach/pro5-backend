function extractBeforeA(inputString = "") {
  var indexOfA = inputString.indexOf("A:");
  if (indexOfA !== -1) {
    var substringBeforeA = inputString.substring(0, indexOfA);
    return substringBeforeA.replace("Q:", "");
  } else {
    return inputString;
  }
}

module.exports = {
  extractBeforeA,
};
