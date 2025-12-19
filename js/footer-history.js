(async function(){
  const footer = document.createElement('div');
  footer.id = 'tq-footer';
  // வடிவமைப்பை இன்னும் சுருக்கமாக மாற்றியுள்ளேன்
  footer.innerHTML = `
    <div class="footer-content">
      <span>📚 தொகுப்புகள்: <strong id="quizCount">-</strong></span>
      <span class="sep">|</span>
      <span>🕒 <span id="tq-lastupdate">ஏற்றுகிறது...</span></span>
      <div class="footer-btns">
        <button id="tq-refresh">🔄 புதுப்பி</button>
        <button id="tq-home" onclick="location.href='index.html'">🏠 முகப்பு</button>
        <button id="showScores">📊 மதிப்பெண்</button>
      </div>
    </div>`;
  document.body.appendChild(footer);

  const style = document.createElement('style');
  style.textContent = `
    #tq-footer { 
      position:fixed; bottom:0; left:0; right:0; 
      background: rgba(249, 253, 251, 0.95); 
      border-top: 1px solid #cde5d1; 
      padding: 5px 10px; 
      font-size: 0.8rem; 
      color: #044d2f; 
      z-index: 9999; 
      box-shadow: 0 -1px 5px rgba(0,0,0,0.1);
    }
    .footer-content { 
      display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; 
    }
    .footer-btns { display: flex; gap: 5px; }
    #tq-footer button { 
      padding: 3px 8px; border-radius: 4px; border: none; 
      font-size: 0.75rem; font-weight: 600; cursor: pointer; color: white;
    }
    #tq-refresh { background: #0b9444; }
    #tq-home { background: #0a58ca; }
    #showScores { background: #ff8c00; }
    .sep { color: #ccc; }
    
    /* வினாக்கள் மறைப்பதைத் தவிர்க்க மெயின் கண்டெய்னருக்கு அடியில் இடைவெளி விடுதல் */
    body { padding-bottom: 50px !important; } 
  `;
  document.head.appendChild(style);

  try {
    const res = await fetch('quiz-list.json', { cache: 'no-cache' });
    const list = await res.json();
    
    let count = 0;
    if (Array.isArray(list)) {
        list.forEach(cat => {
            if (cat.quizzes) count += cat.quizzes.length;
            else count++;
        });
    }
    document.getElementById('quizCount').textContent = count;

    const date = new Date();
    const fmt = date.toLocaleTimeString('ta-IN', { 
        hour: '2-digit', minute: '2-digit', hour12: true 
    });
    document.getElementById('tq-lastupdate').textContent = "இன்று " + fmt;
    
  } catch(e) {
    document.getElementById('tq-lastupdate').textContent = "தகவல் இல்லை";
  }

  document.getElementById('tq-refresh').onclick = () => location.reload();

  // மதிப்பெண் சேமிப்பு மற்றும் காட்சிப்படுத்துதல் (மாற்றமில்லை)
  window.saveScore = function(file, score, total, title){
    const rec = { file, title, score, total, pct: ((score/total)*100).toFixed(1), ts: new Date().toISOString() };
    const arr = JSON.parse(localStorage.getItem('quizScores') || '[]');
    arr.unshift(rec);
    localStorage.setItem('quizScores', JSON.stringify(arr.slice(0,100)));
  };

  document.getElementById('showScores').onclick = function(){
    const arr = JSON.parse(localStorage.getItem('quizScores') || '[]');
    let html = `<h3 style="text-align:center">📊 என் முயற்சிகள்</h3>`;
    if(arr.length===0){ html += "<p>இன்னும் முயற்சிகள் இல்லை.</p>"; }
    else {
      html += `<table border='1' cellspacing='0' cellpadding='5' style='width:100%; font-size:0.85rem; border-collapse:collapse;'>
                <tr style="background:#eee"><th>தொகுப்பு</th><th>மதிப்பெண்</th><th>%</th><th>நேரம்</th></tr>`;
      arr.forEach(r=>{ 
        html += `<tr><td>${r.title}</td><td>${r.score}/${r.total}</td><td>${r.pct}%</td><td>${new Date(r.ts).toLocaleTimeString('ta-IN')}</td></tr>`; 
      });
      html += `</table>`;
    }
    const w = window.open("", "_blank", "width=500,height=400");
    w.document.write(`<html><body style='font-family:sans-serif;'>${html}</body></html>`);
  };
})();
