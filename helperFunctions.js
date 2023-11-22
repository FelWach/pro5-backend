function extractBeforeA(inputString = "") {
  var indexOfA = inputString.indexOf("A:");
  if (indexOfA !== -1) {
    var substringBeforeA = inputString.substring(0, indexOfA);
    return substringBeforeA.replace("Q:", "");
  } else {
    return inputString;
  }
}

function splitQuestionAnswer(generatedAnswer) {
  let questionRegex = /Q: (.+?)\n/;
  let answerRegex = /A: (.+)/;

  let questionMatch = generatedAnswer.match(questionRegex);
  let answerMatch = generatedAnswer.match(answerRegex);

  let question = questionMatch ? questionMatch[1] : "";
  let answer = answerMatch ? answerMatch[1] : "";

  return { question, answer };
}

function removeNewlines(text) {
  return text.replace(/\n/g, "");
}

module.exports = {
  extractBeforeA,
  splitQuestionAnswer,
  removeNewlines,
};
