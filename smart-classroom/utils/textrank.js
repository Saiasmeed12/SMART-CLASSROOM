const natural = require('natural');
const { Matrix } = require('ml-matrix');
const sw = require('stopword');

function splitSentences(text) {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 40);
}

function sentenceSimilarity(sent1, sent2, tfidf) {
  const v1 = [];
  const v2 = [];

  tfidf.tfidfs(sent1, (i, measure) => v1.push(measure));
  tfidf.tfidfs(sent2, (i, measure) => v2.push(measure));

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function textrankSummarize(text, topN = 5) {
  const sentences = splitSentences(text);
  if (sentences.length <= topN) return sentences.join(' ');

  const tfidf = new natural.TfIdf();
  sentences.forEach(s => tfidf.addDocument(sw.removeStopwords(s.split(' ')).join(' ')));

  const n = sentences.length;
  const simMatrix = Matrix.zeros(n, n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        simMatrix.set(i, j, sentenceSimilarity(sentences[i], sentences[j], tfidf));
      }
    }
  }

  
  let scores = Array(n).fill(1 / n);
  const d = 0.85;

  for (let iter = 0; iter < 20; iter++) {
    const newScores = Array(n).fill((1 - d) / n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (simMatrix.get(j, i) !== 0) {
          newScores[i] += d * scores[j] * simMatrix.get(j, i);
        }
      }
    }
    scores = newScores;
  }

  const ranked = sentences
    .map((s, i) => ({ s, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(obj => obj.s);

  return ranked.join(' ');
}

module.exports = { textrankSummarize };
