const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');


const WHISPER_EXE = "C:/Users/USER/Desktop/whispercpp/release/whisper-cli.exe";
const WHISPER_MODEL = "C:/Users/USER/Desktop/whispercpp/release/ggml-base.en.bin";


function convertToWav(inputPath) {
  return new Promise((resolve, reject) => {      
    const outPath = path.join(
      os.tmpdir(),
      path.basename(inputPath, path.extname(inputPath)) + ".wav"
    );

    ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .outputOptions('-acodec pcm_s16le')
      .on('end', () => resolve(outPath))
      .on('error', reject)
      .save(outPath);
  });
}


function runWhisper(wavPath) {
  return new Promise((resolve, reject) => {
    execFile(
      WHISPER_EXE,
      ['-m', WHISPER_MODEL, '-f', wavPath, '-otxt'],
      { windowsHide: true },
      (err, stdout, stderr) => {

        console.log('WHISPER STDOUT:\n', stdout);
        console.error('WHISPER STDERR:\n', stderr);

        if (err) {
          return reject(err);
        }

        const txtPath = wavPath + '.txt';
        if (!fs.existsSync(txtPath)) {
          return reject(new Error('Whisper output file not found'));
        }

        const text = fs.readFileSync(txtPath, 'utf8');
        fs.unlinkSync(txtPath);
        resolve(text.trim());
      }
    );
  });
}


async function transcribeSingle(filePath) {
  const wavPath = await convertToWav(filePath);
  const transcript = await runWhisper(wavPath);
  fs.unlinkSync(wavPath);
  return { transcript };
}

module.exports = { transcribeSingle };
