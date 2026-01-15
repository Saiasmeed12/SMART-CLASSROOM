const express = require('express');
const fs = require('fs');
const { readPDF } = require('../utils/pdfReader');
const { summarizeText } = require('../utils/summarizer');

const router = express.Router();

router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {    const pdfPath = req.file.path;

    const text = await readPDF(pdfPath);
    const summary = summarizeText(text);

    fs.unlinkSync(pdfPath); 

    res.json({
      type: 'pdf',
      summary
    
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF processing failed' });
  }
});

module.exports = router;
