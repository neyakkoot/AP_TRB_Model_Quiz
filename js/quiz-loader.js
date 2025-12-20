// js/quiz-loader.js
document.addEventListener("DOMContentLoaded", function () {
  const quizSelect = document.getElementById("quizSelect");
  const progressEl = document.getElementById("tv-progress");
  const qEl = document.getElementById("tv-question");
  const optsEl = document.getElementById("tv-options");
  const feedbackEl = document.getElementById("tv-feedback");
  const resultsEl = document.getElementById("tv-results");
  
  // 🔹 புதிய index.html அமைப்பில் உள்ள பொத்தான்களைக் கண்டறிதல்
  const prevBtn = document.getElementById("tv-prev");
  const nextBtn = document.getElementById("tv-next");

  let noteEl = document.getElementById("tv-note");
  if (!noteEl) {
    noteEl = document.createElement("div");
    noteEl.id = "tv-note";
    noteEl.setAttribute("role", "status");
    noteEl.style.marginTop = "0.5rem";
    // இதர கூறுகளைச் சுற்றி அமைத்தல்
    if (resultsEl && resultsEl.parentNode) {
      resultsEl.parentNode.insertBefore(noteEl, resultsEl.nextSibling);
    } else {
      const appContainer = document.getElementById('app-container');
      if (appContainer) {
         appContainer.appendChild(noteEl);
      } else {
         document.body.appendChild(noteEl);
      }
    }
  }

  let quizData = [];
  let idx = 0;
  let score = 0;
  let currentQuizTitle = '';

  // 🔹 வினாடி-வினா பட்டியலை ஏற்றுதல்
  async function loadQuizList() {
    try {
      const res = await fetch("quiz-list.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("quiz-list.json not found");
      const list = await res.json(); 

      list.forEach(categoryItem => {
        const optGroup = document.createElement("optgroup");
        optGroup.label = categoryItem.category; 
        categoryItem.quizzes.forEach(quizItem => {
          const opt = document.createElement("option");
          opt.value = quizItem.file;
          opt.textContent = quizItem.title;
          optGroup.appendChild(opt);
        });
        quizSelect.appendChild(optGroup);
      });
      
      // index.html இல் உள்ள புள்ளிவிவரங்களைப் புதுப்பித்தல்
      if (typeof updateQuizStats === 'function') updateQuizStats();

    } catch (err) {
      console.error("Error loading quiz list:", err);
      progressEl.textContent = "⚠️ வினாடி–வினா பட்டியலை ஏற்ற முடியவில்லை!";
    }
  }

  // 🔹 வினாக்களை ஏற்றுதல் (Shuffle Questions & Reset)
  async function loadQuiz(file) {
    try {
      const res = await fetch(file, { cache: "no-cache" });
      const data = await res.json();
      quizData = data.questions || data;

      // 👑 வினாக்களைச் சீரற்ற முறையில் வரிசைப்படுத்துதல்
      quizData.sort(() => Math.random() - 0.5);

      quizData.forEach(q => {
        q.userChoice = undefined;
        q.shuffledOptions = undefined; // விடைகளைச் சீரமைக்கத் தயார் செய்தல்
      });

      currentQuizTitle = quizSelect.options[quizSelect.selectedIndex].text;
      if (typeof startQuizTimer === 'function') startQuizTimer(quizData.length);

      idx = 0;
      score = 0;
      renderQuestion();
    } catch (err) {
      progressEl.textContent = "⚠️ வினாக்களை ஏற்ற முடியவில்லை.";
    }
  }

  // 🔹 வினா மற்றும் விடைகளைத் திரையில் காட்டுதல் (Shuffle Answers)
  function renderQuestion() {
    const q = quizData[idx];
    if (!q) return;

    const userChoice = q.userChoice;
    const hasAnswered = (userChoice !== undefined);

    progressEl.textContent = `வினா ${idx + 1} / ${quizData.length}`;
    qEl.textContent = q.question;
    optsEl.innerHTML = "";

    // 👑 விடைகளைச் சீரற்ற முறையில் வரிசைப்படுத்துதல்
    if (!q.shuffledOptions) {
      let originalOptions = q.answerOptions || q.options || [];
      q.shuffledOptions = originalOptions
        .map((opt, i) => ({ opt, isCorrect: i === (q.answer || originalOptions.findIndex(o => o.isCorrect)) }))
        .sort(() => Math.random() - 0.5);
    }

    q.shuffledOptions.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML = `<strong>${["(அ)", "(ஆ)", "(இ)", "(ஈ)", "(உ)"][i] || (i + 1)}.</strong> ${typeof item.opt === "string" ? item.opt : item.opt.text}`;

      if (hasAnswered) {
        btn.disabled = true;
        if (item.isCorrect) btn.classList.add("correct");
        if (i === userChoice && !item.isCorrect) btn.classList.add("wrong");
      } else {
        btn.onclick = () => selectAnswer(i, item.isCorrect, btn);
      }
      optsEl.appendChild(btn);
    });

    // விளக்கம் மற்றும் பொத்தான்கள் தெரிவு
    feedbackEl.style.display = hasAnswered ? "block" : "none";
    if (hasAnswered) {
      feedbackEl.innerHTML = `<strong>விளக்கம்:</strong> ${q.explanation || "வழங்கப்படவில்லை."}`;
    }
  }

  function selectAnswer(i, isCorrect, btn) {
    if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
    const q = quizData[idx];
    q.userChoice = i;

    const buttons = optsEl.querySelectorAll("button");
    buttons.forEach(b => b.disabled = true);

    if (isCorrect) {
      score++;
      btn.classList.add("correct");
      noteEl.innerHTML = "✅ சரியான விடை!";
    } else {
      btn.classList.add("wrong");
      q.shuffledOptions.forEach((item, index) => {
        if (item.isCorrect) buttons[index].classList.add("correct");
      });
      noteEl.innerHTML = "❌ தவறான விடை.";
    }
    renderQuestion(); // நிலையைப் புதுப்பிக்க
  }

  // 🔹 Navigation Events
  nextBtn.addEventListener("click", () => {
    if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
    if (idx < quizData.length - 1) {
      idx++;
      renderQuestion();
    } else {
      showResults();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
    if (idx > 0) {
      idx--;
      renderQuestion();
    }
  });

  function showResults() {
    if (typeof showCustomResults === 'function') {
      showCustomResults(score, quizData.length, currentQuizTitle);
    }
  }

  quizSelect.addEventListener("change", e => {
    if (e.target.value) loadQuiz(e.target.value);
  });

  loadQuizList();
});
