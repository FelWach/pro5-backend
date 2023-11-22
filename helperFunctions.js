function extractBeforeA(inputString = "") {
  let indexOfA = inputString.indexOf("A:");
  if (indexOfA !== -1) {
    let substringBeforeA = inputString.substring(0, indexOfA);
    return substringBeforeA.replace("Q:", "");
  } else {
    return inputString;
  }
}

function removeBeforeAndIncludingTopic(inputString = "") {
  const indexOfTopic = inputString.toLowerCase().indexOf("topic:");

  if (indexOfTopic !== -1) {
    const substringAfterTopic = inputString.substring(indexOfTopic + 6); // Adding 6 to exclude "Topic:" or "topic:"
    return substringAfterTopic;
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
  removeBeforeAndIncludingTopic,
};
