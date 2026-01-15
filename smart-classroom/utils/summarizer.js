const { textrankSummarize } = require('./textrank');


function cleanText(text) {
  return text
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')   
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCase(text) {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
}


function summarize(text) {
  if (!text) return '';

  
  const cleanedInput = normalizeCase(cleanText(text));
  let summary = textrankSummarize(cleanedInput, 5);
  summary = normalizeCase(cleanText(summary));

  return summary;
}

module.exports = { summarize };
