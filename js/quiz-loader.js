// js/quiz-loader.js (சீரமைக்கப்பட்ட முழு குறியீடு)
document.addEventListener("DOMContentLoaded", function () {
  const quizSelect = document.getElementById("quizSelect");
  const progressEl = document.getElementById("tv-progress");
  const qEl = document.getElementById("tv-question");
  const optsEl = document.getElementById("tv-options");
  const feedbackEl = document.getElementById("tv-feedback");
  const resultsEl = document.getElementById("tv-results");
  const prevBtn = document.getElementById("tv-prev");
  const nextBtn = document.getElementById("tv-next");

  let noteEl = document.getElementById("tv-note");
  if (!noteEl) {
    noteEl = document.createElement("div");
    noteEl.id = "tv-note";
    noteEl.setAttribute("role", "status");
    noteEl.style.marginTop = "0.5rem";
    const quizNav = document.querySelector('.quiz-nav');
    if (quizNav && quizNav.parentNode) {
      quizNav.parentNode.insertBefore(noteEl, quizNav.nextSibling);
    } else {
      const appContainer = document.getElementById('app-container');
      if (appContainer) appContainer.appendChild(noteEl);
      else document.body.appendChild(noteEl);
    }
  }

  if (!quizSelect || !progressEl || !qEl || !optsEl || !feedbackEl || !resultsEl || !prevBtn || !nextBtn) {
    console.error("Required UI element missing");
    return;
  }

  let quizData = [];
  let idx = 0;
  let score = 0;
  let currentQuizTitle = '';

  // 🔹 Load quiz list
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
    } catch (err) {
      console.error(err);
      progressEl.textContent = "⚠️ வினாடி–வினா பட்டியலை ஏற்ற முடியவில்லை!";
    }
  }

  // 🔹 திருத்தப்பட்ட Load quiz questions
  async function loadQuiz(file) {
    try {
      // 1. பழைய நேரங்காட்டி மற்றும் முடிவுகளை Reset செய்தல்
      if (window.timerInterval) {
        clearInterval(window.timerInterval);
      }
      
      const res = await fetch(file, { cache: "no-cache" });
      if (!res.ok) throw new Error(`${file} not found`);
      const data = await res.json();
      quizData = data.questions || data;
      if (!quizData || !quizData.length) throw new Error("No questions found");

      // 2. தரவுகளைச் சீரமைத்தல்
      for (let i = quizData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quizData[i], quizData[j]] = [quizData[j], quizData[i]];
      }

      quizData.forEach(q => {
        q.userChoice = undefined;
        q.shuffledOptions = undefined;
        q.shuffledCorrectIndex = undefined;
      });

      currentQuizTitle = quizSelect.options[quizSelect.selectedIndex].text;

      // 3. நேரங்காட்டியைத் தொடங்குதல் (Start Timer)
      if (typeof startQuizTimer === 'function') {
        startQuizTimer(quizData.length);
      }

      idx = 0;
      score = 0;
      
      // 4. UI நிலைகளைச் சீரமைத்தல் (Hide Results, Show Question)
      resultsEl.style.display = "none";
      resultsEl.innerHTML = ""; // பழைய முடிவுகளை நீக்குதல்
      feedbackEl.style.display = "none";
      progressEl.style.display = 'block';
      qEl.style.display = 'block';
      optsEl.innerHTML = '';
      if (noteEl) noteEl.innerHTML = "";

      renderQuestion();
      console.log(`📘 Quiz loaded: ${file}`);

    } catch (err) {
      console.error("Quiz load error:", err);
      progressEl.textContent = "⚠️ வினாக்களை ஏற்ற முடியவில்லை: " + err.message;
    }
  }

  // 🔹 Render question
  function renderQuestion() {
    const q = quizData[idx];
    if (!q) return;

    const userChoice = q.userChoice;
    const hasAnswered = (userChoice !== undefined);

    progressEl.textContent = `வினா ${idx + 1} / ${quizData.length}`;
    qEl.textContent = q.question || "வினா கிடைக்கவில்லை.";
    optsEl.innerHTML = "";
    nextBtn.style.display = "inline-block";
    prevBtn.style.display = idx > 0 ? "inline-block" : "none";

    let optionsToRender = q.answerOptions || q.options || [];
    let correctOptionIndex;

    if (!q.shuffledOptions) {
      correctOptionIndex = typeof q.answer === "number"
          ? q.answer
          : (optionsToRender?.findIndex(o => o.isCorrect) ?? 0);

      const optionsWithIndices = optionsToRender.map((opt, i) => ({ opt, originalIndex: i }));

      for (let i = optionsWithIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsWithIndices[i], optionsWithIndices[j]] = [optionsWithIndices[j], optionsWithIndices[i]];
      }

      q.shuffledOptions = optionsWithIndices.map(item => item.opt);
      q.shuffledCorrectIndex = optionsWithIndices.findIndex(item => item.originalIndex === correctOptionIndex);
    } 

    optionsToRender = q.shuffledOptions;
    correctOptionIndex = q.shuffledCorrectIndex;
    
    optionsToRender.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.innerHTML = `<strong>${["(அ)", "(ஆ)", "(இ)", "(ஈ)", "(உ)"][i] || (i + 1)}.</strong> ${
        typeof opt === "string" ? opt : opt.text || ""
      }`;

      if (hasAnswered) {
        btn.disabled = true;
        if (i === correctOptionIndex) btn.classList.add("correct");
        if (i === userChoice && userChoice !== correctOptionIndex) btn.classList.add("wrong");
      } else {
        btn.onclick = () => selectAnswer(i, btn);
      }
      optsEl.appendChild(btn);
    });

    if (hasAnswered) {
      const originalOptions = q.answerOptions || q.options || [];
      const originalCorrectIndex = typeof q.answer === "number" ? q.answer : (originalOptions?.findIndex(o => o.isCorrect) ?? 0);
      const explanation = q.explanation || originalOptions?.[originalCorrectIndex]?.rationale || "விளக்கம் வழங்கப்படவில்லை.";
      feedbackEl.style.display = "block";
      feedbackEl.innerHTML = `<strong>விளக்கம்:</strong> ${explanation}`;
      if (noteEl) noteEl.innerHTML = "✅❌ நீங்கள் ஏற்கனவே பதிலளித்த வினா.";
    } else {
      feedbackEl.style.display = "none";
      if (noteEl) noteEl.innerHTML = "🧾 வினாவை படித்து சரியான விடையைத் தேர்ந்தெடுக்கவும்.";
    }
  }

  // 🔹 Select answer
  function selectAnswer(choice, btn) {
    if (typeof resetInactivityTimer === 'function') resetInactivityTimer();
    const q = quizData[idx];
    if (!q || q.userChoice !== undefined) return; 
    
    q.userChoice = choice;
    const correctIndex = q.shuffledCorrectIndex; 
    const buttons = optsEl.querySelectorAll("button");
    buttons.forEach(b => (b.disabled = true)); 

    if (choice === correctIndex) {
      score++; 
      btn.classList.add("correct");
      if (noteEl) noteEl.innerHTML = "✅ சரியான விடை!";
    } else {
      btn.classList.add("wrong");
      if (buttons[correctIndex]) buttons[correctIndex].classList.add("correct");
      if (noteEl) noteEl.innerHTML = "❌ தவறான விடை.";
    }

    const originalOptions = q.answerOptions || q.options || [];
    const originalCorrectIndex = typeof q.answer === "number" ? q.answer : (originalOptions?.findIndex(o => o.isCorrect) ?? 0);
    const explanation = q.explanation || originalOptions?.[originalCorrectIndex]?.rationale || "விளக்கம் வழங்கப்படவில்லை.";
    feedbackEl.style.display = "block";
    feedbackEl.innerHTML = `<strong>விளக்கம்:</strong> ${explanation}`;
  }

  // 🔹 Navigation buttons
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
    if (window.timerInterval) clearInterval(window.timerInterval); // முடிவுகளின் போது நேரத்தை நிறுத்து
    if (typeof showCustomResults === 'function') {
      showCustomResults(score, quizData.length, currentQuizTitle);
    }
  }
  
  window.showResults = showResults; 

  quizSelect.addEventListener("change", e => {
    if (e.target.value) loadQuiz(e.target.value);
  });

  loadQuizList();
});
