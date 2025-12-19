(async function(){
  // 1. அடிக்குறிப்பு (Footer) உருவாக்கம்
  const footer = document.createElement('div');
  footer.id = 'tq-footer';
  footer.innerHTML = `
    <div class="footer-content">
      <span>📚 தொகுப்புகள்: <strong id="quizCount">...</strong></span>
      <span class="sep">|</span>
      <span>🕒 <span id="tq-lastupdate">ஏற்றுகிறது...</span></span>
      <div class="footer-btns">
        <button id="tq-refresh">🔄 புதுப்பி</button>
        <button id="tq-home" onclick="location.href='index.html'">🏠 முகப்பு</button>
        <button id="showScores">📊 மதிப்பெண்</button>
      </div>
    </div>`;
  document.body.appendChild(footer);

  // 2. சிறிய அளவிலான CSS வடிவமைப்பு (வினாக்களை மறைக்காது)
  const style = document.createElement('style');
  style.textContent = `
    #tq-footer { 
      position:fixed; bottom:0; left:0; right:0; 
      background: rgba(255, 255, 255, 0.98); 
      border-top: 1px solid #cde5d1; 
      padding: 5px 10px; 
      font-size: 0.8rem; 
      color: #044d2f; 
      z-index: 10000; 
      box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    }
    .footer-content { display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap; }
    .footer-btns { display: flex; gap: 8px; }
    #tq-footer button { 
      padding: 4px 10px; border-radius: 5px; border: none; 
      font-size: 0.75rem; font-weight: 600; cursor: pointer; color: white;
      transition: opacity 0.2s;
    }
    #tq-footer button:hover { opacity: 0.8; }
    #tq-refresh { background: #0b9444; }
    #tq-home { background: #0a58ca; }
    #showScores { background: #ff8c00; }
    .sep { color: #ddd; }
    body { padding-bottom: 50px !important; } 
  `;
  document.head.appendChild(style);

  // 3. தரவுகளைப் புதுப்பித்தல்
  try {
    const res = await fetch('quiz-list.json', { cache: 'no-cache' });
    const list = await res.json();
    
    // 21 தொகுப்புகளைச் சரியாகக் கணக்கிடும் தர்க்கம்
    let totalQuizzes = 0;
    if (Array.isArray(list)) {
        list.forEach(item => {
            if (item.quizzes && Array.isArray(item.quizzes)) {
                totalQuizzes += item.quizzes.length; // பிரிவுகளுக்குள் உள்ள வினாக்கள்
            } else {
                totalQuizzes += 1; // தனி வினாக்கள்
            }
        });
    }
    document.getElementById('quizCount').textContent = totalQuizzes;

    // இன்றைய தேதி மற்றும் நேரத்தைப் புதுப்பித்தல்
    const now = new Date();
    const fmt = now.toLocaleString('ta-IN', { 
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true 
    });
    document.getElementById('tq-lastupdate').textContent = fmt;
    
  } catch(e) {
    console.error("Footer update error:", e);
    document.getElementById('tq-lastupdate').textContent = "தகவல் இல்லை";
  }

  // 4. பொத்தான்களின் செயல்பாடுகள்
  document.getElementById('tq-refresh').onclick = () => location.reload();

  document.getElementById('showScores').onclick = function(){
    const arr = JSON.parse(localStorage.getItem('quizScores') || '[]');
    let html = `<h3 style="text-align:center; font-family:sans-serif; color:#0a58ca;">📊 எனது பயிற்சி முடிவுகள்</h3>`;
    if(arr.length === 0){ 
        html += "<p style='text-align:center;'>இன்னும் எந்தப் பயிற்சியும் எடுக்கப்படவில்லை.</p>"; 
    } else {
      html += `<table border='1' cellspacing='0' cellpadding='8' style='width:100%; font-family:sans-serif; font-size:0.85rem; border-collapse:collapse;'>
                <tr style="background:#f2f2f2"><th>வினாடி-வினா</th><th>மதிப்பெண்</th><th>%</th><th>தேதி</th></tr>`;
      arr.forEach(r => { 
        const d = r.ts ? new Date(r.ts).toLocaleString('ta-IN') : "-";
        html += `<tr><td>${r.title}</td><td>${r.score}/${r.total}</td><td>${r.pct}%</td><td>${d}</td></tr>`; 
      });
      html += `</table>`;
    }
    const w = window.open("", "_blank", "width=600,height=500");
    w.document.write(`<html><head><title>மதிப்பெண்கள்</title></head><body style='padding:20px;'>${html}</body></html>`);
  };
})();
