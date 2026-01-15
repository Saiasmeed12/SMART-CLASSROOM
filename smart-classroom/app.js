require('dotenv').config();
process.env.PDFJS_DISABLE_FONTFACE = 'true';

const express = require('express');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const { summarize } = require('./utils/summarizer');
const { generateQuiz } = require('./utils/quizGenerator');
const { transcribeSingle } = require('./utils/asr');
const Lecture = require('./models/Lecture');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and PDF files allowed'), false);
    }
  }
});

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartclass';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get('/', (_, res) => {
  res.render('index', { title: 'Smart Classroom' });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = (req.body.type || 'audio').toLowerCase();

    const lecture = await Lecture.create({
      title: req.file.originalname,
      filePath: req.file.path,
      fileType: type,
      status: 'uploaded'
    });

    if (type === 'audio') {
      const { transcript } = await transcribeSingle(req.file.path);
      const summary = summarize(transcript);
      const quiz = generateQuiz(transcript);

      lecture.transcript = transcript;
      lecture.summary = summary;
      lecture.quiz = quiz;
      lecture.status = 'ready';

      await lecture.save();

      return res.json({
        lectureId: lecture._id,
        summary,
        quiz
      });
    }

    if (type === 'pdf') {
      const buffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(buffer);

      const summary = summarize(pdfData.text);
      const quiz = generateQuiz(pdfData.text);

      lecture.transcript = pdfData.text;
      lecture.summary = summary;
      lecture.quiz = quiz;
      lecture.status = 'ready';

      await lecture.save();

      return res.json({
        lectureId: lecture._id,
        summary,
        quiz
      });
    }

    return res.status(400).json({ error: 'Unsupported file type' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.get('/lecture/:id', async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) {
    return res.status(404).json({ error: 'Lecture not found' });
  }
  res.json(lecture);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
