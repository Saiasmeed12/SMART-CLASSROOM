const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

function cleanText(text) {
  return text
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function pickWord(words, indexRatio) {
  return words[Math.floor(words.length * indexRatio)];
}


function generateMCQs(sentences, count = 10) {
  const mcqs = [];

  for (let s of sentences) {
    if (mcqs.length >= count) break;

    const words = tokenizer
      .tokenize(s)
      .filter(w => w.length > 4 && /^[A-Za-z]+$/.test(w));

    if (words.length < 6) continue;

    const answer = pickWord(words, 0.3);

    const question = s.replace(
      new RegExp(`\\b${answer}\\b`, 'i'),
      '_____'
    );

    const options = shuffle([
      answer,
      ...shuffle(words.filter(w => w !== answer)).slice(0, 3)
    ]);

    mcqs.push({ question, options, answer });
  }

  return mcqs;
}

function generateFillBlanks(sentences, count = 10) {
  const blanks = [];

  for (let s of sentences) {
    if (blanks.length >= count) break;

    const words = tokenizer
      .tokenize(s)
      .filter(w => w.length > 4 && /^[A-Za-z]+$/.test(w));

    if (words.length < 6) continue;

    const answer = pickWord(words, 0.7);

    const question = s.replace(
      new RegExp(`\\b${answer}\\b`, 'i'),
      '_____'
    );

    blanks.push({ question, answer });
  }

  return blanks;
}


function generateQuiz(text) {
  text = cleanText(text);

  const sentences = text
    .split('.')
    .map(s => s.trim())
    .filter(s => s.length > 40);

  return {
    mcq: generateMCQs(sentences.slice(0, 10), 10),
    fill: generateFillBlanks(sentences.slice(10, 20), 10)
  };
}

module.exports = { generateQuiz };
