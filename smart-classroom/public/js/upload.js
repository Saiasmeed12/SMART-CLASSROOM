document.addEventListener('DOMContentLoaded', () => {
  const audioBar = document.getElementById('upload-audio');
  const pdfBar = document.getElementById('upload-pdf');

  const audioInput = document.getElementById('audio-input');
  const pdfInput = document.getElementById('pdf-input');

  const summaryDiv = document.getElementById('summary');
  const quizDiv = document.getElementById('quiz-content');


  audioBar.addEventListener('click', () => audioInput.click());
  pdfBar.addEventListener('click', () => pdfInput.click());

  
  async function uploadFile(file, type) {
    summaryDiv.innerHTML =
      `<div class="uploading">Generating summary...</div>`;
    quizDiv.innerHTML =
      `<div class="upload-status">Generating quiz...</div>`;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);

    try {
      const resp = await fetch('/upload', {
        method: 'POST',
        body: fd
      });

      if (!resp.ok) throw new Error('Upload failed');

      const json = await resp.json();

      
      summaryDiv.innerHTML = `
        <div class="generated-summary">
          ${json.summary || 'No summary returned'}
        </div>
      `;

      
      if (json.quiz) {
        renderQuiz(json.quiz);
      } else {
        quizDiv.innerHTML =
          `<div class="upload-status">No quiz generated</div>`;
      }

    } catch (err) {
      summaryDiv.innerHTML =
        `<div class="upload-status">Error: ${err.message}</div>`;
      quizDiv.innerHTML = '';
    }
  }

  
  function renderQuiz(quiz) {
    let mcqHtml = `
      <div class="quiz-left">
        <h3>Choose the correct option</h3>
    `;

    quiz.mcq.forEach((q, i) => {
      mcqHtml += `
        <div class="question">
          <p>Q${i + 1}. ${q.question}</p>
          <div class="mcq-options">
      `;

      q.options.forEach(opt => {
        mcqHtml += `
          <label class="mcq-option">
            <input type="radio"
                   name="mcq-${i}"
                   value="${opt}"
                   data-answer="${q.answer}">
            ${opt}
          </label>
        `;
      });

      mcqHtml += `
          </div>
        </div>
      `;
    });

    mcqHtml += `</div>`;

    let fillHtml = `
      <div class="quiz-right">
        <h3>Fill in the blanks</h3>
    `;

    quiz.fill.forEach((q, i) => {
      fillHtml += `
        <div class="question">
          <p>Q${i + 1}. ${q.question}</p>
          <input type="text"
                 class="fill-input"
                 data-answer="${q.answer}">
        </div>
      `;
    });

    fillHtml += `</div>`;

    quizDiv.innerHTML = `
      <div class="quiz-wrapper">
        ${mcqHtml}
        ${fillHtml}
      </div>

      <button id="submit-quiz">Submit Quiz</button>
      <div id="result"></div>
    `;

    document
      .getElementById('submit-quiz')
      .addEventListener('click', evaluateQuiz);
  }

  
  function evaluateQuiz() {
    let score = 0;

    
    const mcqGroups = new Set();
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      mcqGroups.add(r.name);
    });

    mcqGroups.forEach(name => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      let correctAnswer = '';

      radios.forEach(r => {
        correctAnswer = r.dataset.answer;
        r.disabled = true;

        const label = r.closest('label');

        if (r.value === correctAnswer) {
          label.classList.add('correct-option');
        }

        if (r.checked && r.value !== correctAnswer) {
          label.classList.add('wrong-option');
        }

        if (r.checked && r.value === correctAnswer) {
          score += 1;
        }
      });
    });

    document.querySelectorAll('.fill-input').forEach(input => {
      const userAns = input.value.trim().toLowerCase();
      const correctAns = input.dataset.answer.trim();

      input.disabled = true;

      if (userAns === correctAns.toLowerCase()) {
        input.style.border = '2px solid green';
        score += 1;
      } else {
      input.style.border = '2px solid red';

        
        const answerDiv = document.createElement('div');
        answerDiv.className = 'fib-correct-answer';
        answerDiv.innerHTML = `<strong>Correct answer:</strong> ${correctAns}`;
        input.parentElement.appendChild(answerDiv);
      }
    });

    
    const totalQuestions =
      document.querySelectorAll('.question').length;

    const percentage = Math.round((score / totalQuestions) * 100);

    let level = 'Needs Improvement📈';
    if (percentage >= 80) level = 'Excellent🥳';
    else if (percentage >= 50) level = 'Good💪';

    document.getElementById('result').innerHTML = `
      <h3>Result</h3>
      <p><strong>Score:</strong> ${score} / ${totalQuestions}</p>
      <p><strong>Percentage:</strong> ${percentage}%</p>
      <p><strong>Performance:</strong> ${level}</p>
    `;

    
    document.getElementById('submit-quiz').style.display = 'none';
  }

  
  audioInput.addEventListener('change', e => {
    if (e.target.files.length) {
      uploadFile(e.target.files[0], 'audio');
    }
  });

  pdfInput.addEventListener('change', e => {
    if (e.target.files.length) {
      uploadFile(e.target.files[0], 'pdf');
    }
  });
});
