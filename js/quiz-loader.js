// js/quiz-loader.js
document.addEventListener("DOMContentLoaded", function () {
  const quizSelect = document.getElementById("quizSelect");
  const progressEl = document.getElementById("tv-progress");
  const qEl = document.getElementById("tv-question");
  const optsEl = document.getElementById("tv-options");
  const feedbackEl = document.getElementById("tv-feedback");
  const resultsEl = document.getElementById("tv-results");
  const prevBtn = document.getElementById("tv-prev");
  const nextBtn = document.getElementById("tv-next");
  const fixedFooter = document.getElementById("fixed-footer-nav");

  let quizData = [];
  let idx = 0;
  let score = 0;
  let currentQuizTitle = '';

  async function loadQuizList() {
    try {
      const res = await fetch("quiz-list.json", { cache: "no-cache" });
      const list = await res.json(); 
      list.forEach(cat => {
        const group = document.createElement("optgroup");
        group.label = cat.category; 
        cat.quizzes.forEach(quiz => {
          const opt = document.createElement("option");
          opt.value = quiz.file;
          opt.textContent = quiz.title;
          group.appendChild(opt);
        });
        quizSelect.appendChild(group);
      });
      if (typeof updateQuizStats === 'function') updateQuizStats();
    } catch (err) { console.error(err); }
  }

  async function loadQuiz(file) {
    try {
      const res = await fetch(file, { cache: "no-cache" });
      const data = await res.json();
      quizData = data.questions || data;
      quizData.sort(() => Math.random() - 0.5); // வினாக்கள் Shuffle

      quizData.forEach(q => {
        q.userChoice = undefined;
        q.shuffledOptions = undefined;
      });

      currentQuizTitle = quizSelect.options[quizSelect.selectedIndex].text;
      fixedFooter.classList.remove("hidden");
      idx = 0; score = 0;
      renderQuestion();
    } catch (err) { console.error(err); }
  }

  function renderQuestion() {
    const q = quizData[idx];
    if (!q) return;

    const hasAnswered = (q.userChoice !== undefined);
    progressEl.textContent = `வினா ${idx + 1} / ${quizData.length}`;
    qEl.textContent = q.question;
    optsEl.innerHTML = "";

    if (!q.shuffledOptions) {
      let originalOpts = q.answerOptions || q.options || [];
      q.shuffledOptions = originalOpts
        .map((opt, i) => ({ opt, isCorrect: i === (q.answer || originalOpts.findIndex(o => o.isCorrect)) }))
        .sort(() => Math.random() - 0.5); // விடைகள் Shuffle
    }

    q.shuffledOptions.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML = `<strong>${["(அ)", "(ஆ)", "(இ)", "(ஈ)", "(உ)"][i]}.</strong> ${typeof item.opt === "string" ? item.opt : item.opt.text}`;

      if (hasAnswered) {
        btn.disabled = true;
        if (item.isCorrect) btn.classList.add("correct");
        if (i === q.userChoice && !item.isCorrect) btn.classList.add("wrong");
      } else {
        btn.onclick = () => selectAnswer(i, item.isCorrect, btn);
      }
      optsEl.appendChild(btn);
    });

    feedbackEl.style.display = hasAnswered ? "block" : "none";
    if (hasAnswered) feedbackEl.innerHTML = `<strong>விளக்கம்:</strong> ${q.explanation || "வழங்கப்படவில்லை."}`;
  }

  // 👑 பாப்-அப் நுட்பத்துடன் கூடிய விடை தேர்வு 👑
  function selectAnswer(i, isCorrect, btn) {
    const q = quizData[idx];
    q.userChoice = i;
    const buttons = optsEl.querySelectorAll("button");
    buttons.forEach(b => b.disabled = true);

    const modal = document.getElementById('quiz-modal');
    const modalHeader = document.getElementById('modal-header');
    const modalBody = document.getElementById('modal-body');
    const correctIdx = q.shuffledOptions.findIndex(item => item.isCorrect);
    const correctLabel = ["(அ)", "(ஆ)", "(இ)", "(ஈ)", "(உ)"][correctIdx];
    const explanation = q.explanation || "விளக்கம் வழங்கப்படவில்லை.";

    if (isCorrect) {
      score++;
      btn.classList.add("correct");
      modalHeader.innerHTML = "✅ மிகச் சிறப்பு!";
      modalHeader.style.color = "#28a745";
      modalBody.innerHTML = `நீங்கள் சரியான விடையைத் தேர்ந்தெடுத்துள்ளீர்கள். <br><br> <strong>விளக்கம்:</strong> ${explanation}`;
    } else {
      btn.classList.add("wrong");
      q.shuffledOptions.forEach((item, index) => { if (item.isCorrect) buttons[index].classList.add("correct"); });
      modalHeader.innerHTML = "❌ தவறான விடை!";
      modalHeader.style.color = "#dc3545";
      modalBody.innerHTML = `சரியான விடை: <strong>${correctLabel}</strong> <br><br> <strong>விளக்கம்:</strong> ${explanation}`;
    }
    modal.style.display = 'block';
    renderQuestion();
  }

  nextBtn.addEventListener("click", () => {
    if (idx < quizData.length - 1) { idx++; renderQuestion(); } 
    else { fixedFooter.classList.add("hidden"); showResults(); }
  });

  prevBtn.addEventListener("click", () => { if (idx > 0) { idx--; renderQuestion(); } });

  function showResults() {
    resultsEl.classList.remove("hidden");
    document.getElementById("tv-result-score").textContent = `உங்கள் மதிப்பெண்: ${score} / ${quizData.length}`;
    // saveQuizResult(currentQuizTitle, score, quizData.length...) logic here
  }

  quizSelect.addEventListener("change", e => loadQuiz(e.target.value));
  loadQuizList();
});
