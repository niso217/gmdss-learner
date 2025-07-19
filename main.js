const app = document.getElementById('app');
const questions = window.gmdssQuestions;

let state = {
  tab: 0,
  mode: 'basic', // 'basic' | 'advanced'
  theme: 'light', // 'light' | 'dark'
  revealed: {}, // { [questionId_sectionIdx]: numRevealed }
  answers: {}, // { [questionId_sectionIdx]: [userAnswers] }
};

function isEnglish(str) {
  // בדוק אם יש תווים עבריים במשפט
  const hebrewRegex = /[\u0590-\u05FF]/;
  return !hebrewRegex.test(str);
}

function normalize(str) {
  return str.trim().replace(/\s+/g, ' ').toUpperCase();
}

function expandX3(sentence) {
  if (!sentence.includes('X3')) return sentence;
  
  if (sentence.startsWith('THIS IS ')) {
    // THIS IS TOMA X3 -> THIS IS TOMA TOMA TOMA
    const parts = sentence.split(' ');
    const lastWord = parts[parts.length - 1]; // TOMA
    return parts.slice(0, -1).join(' ') + ' ' + lastWord + ' ' + lastWord + ' ' + lastWord;
  }
  
  // רגיל: MAYDAY X3 -> MAYDAY MAYDAY MAYDAY
  return sentence.replace(/([A-Z]+) X3/, '$1 $1 $1');
}

function isRadioCommunication(sentence) {
  // משפטים שמייצגים שיחה בקשר
  const radioKeywords = [
    'MAYDAY', 'OVER', 'OUT', 'THIS IS', 'ALL STATION', 'ALL STATIONS',
    'SEELONCE', 'FEENEE', 'RECEIVED', 'MMSI', 'UTC',
    // שמות הספינות
    'TOMA', 'GATO', 'RONI', 'ALASKA',
    // מיקום
    'DEGREES', 'MINUTES', 'NORTH', 'SOUTH', 'EAST', 'WEST',
    // מצב הספינה (רק במשפטי שיחה)
    'DISABLED AND DRIFTING', 'FIRE ON BOARD', 'TAKING WATER',
    'IN DANGER OF SINKING',
    // בקשות עזרה
    'REQUIRE IMMEDIATE ASSISTANCE',
    // מספר אנשים
    'PERSONS ON BOARD'
  ];
  return radioKeywords.some(keyword => sentence.includes(keyword));
}

function getSectionKey(qid, sidx) {
  return `${qid}_${sidx}`;
}

// פונקציה ליצירת קונפטי
function createConfetti() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.borderRadius = '50%';
    
    document.body.appendChild(confetti);
    
    const animation = confetti.animate([
      { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
      { transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], {
      duration: 3000 + Math.random() * 2000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
    
    animation.onfinish = () => {
      document.body.removeChild(confetti);
    };
  }
}

function renderTabs() {
  return `<div class="tabs">
    <div class="tabs-left">
      <button class="tab-nav-btn" onclick="scrollTabs('left')" title="גלול שמאלה">‹</button>
      ${questions
        .map(
          (q, i) =>
            `<button class="tab${state.tab === i ? ' active' : ''}" onclick="selectTab(${i})" style="direction:rtl;text-align:center;">שאלה ${i + 1}</button>`
        )
        .join('')}
      <button class="tab-nav-btn" onclick="scrollTabs('right')" title="גלול ימינה">›</button>
    </div>
  </div>
  <div class="controls-row">
    <div class="mode-toggle">
      <span class="mode-label">מצב:</span>
      <label class="toggle-mode">
        <input type="checkbox" ${state.mode === 'advanced' ? 'checked' : ''} onchange="toggleMode()">
        <span class="toggle-slider"></span>
      </label>
      <span class="mode-text">${state.mode === 'advanced' ? 'מתקדם' : 'בסיס'}</span>
    </div>
    <div class="theme-toggle">
      <span class="theme-label">ערכת נושא:</span>
      <label class="theme-toggle-mode">
        <input type="checkbox" ${state.theme === 'dark' ? 'checked' : ''} onchange="toggleTheme()">
        <span class="theme-toggle-slider"></span>
      </label>
      <span class="theme-toggle-text">${state.theme === 'dark' ? '🌙' : '☀️'}</span>
    </div>
  </div>`;
}



function renderBasicSection(section, qid, sidx) {
  const key = getSectionKey(qid, sidx);
  const revealed = state.revealed[key] || 0;
  
  return `
    ${section.sentences
      .map((sentence, idx) => {
        if (idx < revealed) {
          const isRadio = isRadioCommunication(sentence);
          const isEng = isEnglish(sentence);
          const direction = isEng ? 'ltr' : 'rtl';
          const textAlign = isEng ? 'left' : 'right';
          const textTransform = isEng ? 'uppercase' : 'none';
          return `<div class="sentence-row"><div class="sentence-text" style="direction:${direction};text-align:${textAlign};text-transform:${textTransform};font-weight:${isRadio ? 'bold' : 'normal'}">${expandX3(sentence)}</div></div>`;
        } else if (idx === revealed) {
          return `<div class="sentence-row" style="text-align:center;">
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px;">
              <button 
                onclick="showAllSentences('${key}')" 
                style="padding:6px 12px;font-size:0.9em;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;"
              >
                הצג הכל
              </button>
              <button 
                onclick="showNextSentence('${key}')" 
                style="padding:6px 12px;font-size:0.9em;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;"
              >
                הבא
              </button>
              <button 
                onclick="clearAllSentences('${key}')" 
                style="padding:6px 12px;font-size:0.9em;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;"
              >
                נקה
              </button>
            </div>
          </div>`;
        } else {
          return '';
        }
      })
      .join('')}
    ${revealed === section.sentences.length ? `
      <div class="sentence-row" style="text-align:center;">
        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
          <button 
            onclick="clearAllSentences('${key}')" 
            style="padding:6px 12px;font-size:0.9em;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;"
          >
            נקה
          </button>
        </div>
      </div>
    ` : ''}
  `;
}

function compareSentences(user, correct) {
  // x3 logic
  const expCorrect = expandX3(correct);
  const normUser = normalize(user);
  const normCorrect = normalize(expCorrect);
  if (!normUser) return 0;
  if (normUser === normCorrect) return 100;
  // חישוב דמיון בסיסי (Levenshtein או פשוט)
  const u = normUser.split(' ');
  const c = normCorrect.split(' ');
  let match = 0;
  for (let i = 0; i < Math.min(u.length, c.length); i++) {
    if (u[i] === c[i]) match++;
  }
  return Math.round((match / c.length) * 100);
}

function renderAdvancedSection(section, qid, sidx) {
  const key = getSectionKey(qid, sidx);
  const answers = state.answers[key] || Array(section.sentences.length).fill('');
  let total = 0;
  let count = 0;
  
  // בדוק אם כל המשפטים נכונים ב-100%
  const allCorrect = section.sentences.every((sentence, idx) => {
    const acc = compareSentences(answers[idx] || '', sentence);
    return acc === 100;
  });
  
  return `
    ${section.sentences
      .map((sentence, idx) => {
        const isEng = isEnglish(sentence);
        const val = answers[idx] || '';
        const acc = compareSentences(val, sentence);
        if (acc > 0) { total += acc; count++; }
        const isRadio = isRadioCommunication(sentence);
        const direction = isEng ? 'ltr' : 'rtl';
        const textAlign = isEng ? 'left' : 'right';
        const textTransform = isEng ? 'uppercase' : 'none';
        return `<div class="input-row">
          <input class="input-sentence" type="text" style="direction:${direction};text-align:${textAlign};text-transform:${textTransform};font-weight:${isRadio ? 'bold' : 'normal'}" value="${val.replace(/"/g, '&quot;')}" oninput="updateAnswer('${key}',${idx},this.value)" data-key="${key}" data-idx="${idx}">
          <span class="accuracy" style="color:${acc === 100 ? '#388e3c' : acc > 60 ? '#fbc02d' : '#d32f2f'}">${val ? acc + '%' : ''}</span>
        </div>`;
      })
      .join('')}
    <div class="input-row" data-key="${key}">
      <div class="score-box" style="direction:rtl;text-align:right;padding:8px;border:1px solid #ddd;border-radius:4px;background:#f8f9fa;margin-top:8px;color:#333;">ציון: ${count ? Math.round((total / (section.sentences.length * 100)) * (section.label.includes('א') ? 80 : 20)) : 0} / ${section.label.includes('א') ? 80 : 20}</div>
    </div>
    ${allCorrect ? '<div style="text-align:center;margin-top:16px;color:#4caf50;font-weight:bold;font-size:1.2em;">🎉 כל המשפטים נכונים! 🎉</div>' : ''}
  `;
}



function renderQuestion(q) {
  console.log('Rendering question with sections:', q.sections.length);
  console.log('Question description:', q.description);
  return `
    <div class="content">
      <div class="sticky-question">
        <div class="question-title">${q.title}</div>
        <div class="question-description" style="border: 2px solid blue; padding: 15px; margin: 10px 0;">${q.description}</div>
      </div>
      ${q.sections
        .map((section, sidx) => {
          console.log('Rendering section:', section.label, sidx);
          const sectionContent = state.mode === 'basic'
            ? renderBasicSection(section, q.id, sidx)
            : renderAdvancedSection(section, q.id, sidx);
          
          return `
            <div class="section-container">
              <div class="section-header">
                <h3 class="section-title">${section.label}</h3>
              </div>
              <div class="section-content">
                <div class="section-description">
                  ${section.description}
                </div>
                ${sectionContent}
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function render() {
  // החל את ה-theme
  document.body.setAttribute('data-theme', state.theme);
  
  app.innerHTML = `
    ${renderTabs()}
    ${renderQuestion(questions[state.tab])}
  `;
  
  // שמור את הפוקוס אחרי רינדור
  if (state.mode === 'advanced') {
    setTimeout(() => {
      const inputs = document.querySelectorAll('.input-sentence');
      inputs.forEach(input => {
        const key = input.getAttribute('data-key');
        const idx = parseInt(input.getAttribute('data-idx'));
        if (key && state.answers[key] && state.answers[key][idx] !== undefined) {
          input.value = state.answers[key][idx];
        }
      });
    }, 0);
  }
}

function renderWithoutFocus() {
  app.innerHTML = `
    ${renderTabs()}
    ${renderQuestion(questions[state.tab])}
  `;
  
  // עדכן ערכים ללא שמירת פוקוס
  if (state.mode === 'advanced') {
    const inputs = document.querySelectorAll('.input-sentence');
    inputs.forEach(input => {
      const key = input.getAttribute('data-key');
      const idx = parseInt(input.getAttribute('data-idx'));
      if (key && state.answers[key] && state.answers[key][idx] !== undefined) {
        input.value = state.answers[key][idx];
      }
    });
  }
}

function updateSingleInput(key, idx, val) {
  // עדכן רק את האלמנט הספציפי
  const inputElement = document.querySelector(`input[data-key="${key}"][data-idx="${idx}"]`);
  if (inputElement) {
    inputElement.value = val;
    
    // עדכן את האחוז דיוק
    const sentence = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key).sentences[idx];
    const accuracy = compareSentences(val, sentence);
    const accuracyElement = inputElement.parentElement.querySelector('.accuracy');
    if (accuracyElement) {
      accuracyElement.textContent = val ? accuracy + '%' : '';
      accuracyElement.style.color = accuracy === 100 ? '#388e3c' : accuracy > 60 ? '#fbc02d' : '#d32f2f';
    }
    
    // עדכן את הציון
    updateScore(key);
  }
}

function updateScore(key) {
  const [qid, sidx] = key.split('_');
  const section = questions[state.tab].sections[parseInt(sidx)];
  const answers = state.answers[key] || Array(section.sentences.length).fill('');
  
  let total = 0;
  let count = 0;
  
  section.sentences.forEach((sentence, idx) => {
    const acc = compareSentences(answers[idx] || '', sentence);
    if (acc > 0) { total += acc; count++; }
  });
  
  const scoreElement = document.querySelector(`[data-key="${key}"] .score-box`);
  if (scoreElement) {
    const score = count ? Math.round((total / (section.sentences.length * 100)) * (section.label.includes('א') ? 80 : 20)) : 0;
    const maxScore = section.label.includes('א') ? 80 : 20;
    scoreElement.textContent = `ציון: ${score} / ${maxScore}`;
  }
}

window.selectTab = function (i) {
  state.tab = i;
  render();
};

window.toggleMode = function () {
  state.mode = state.mode === 'basic' ? 'advanced' : 'basic';
  render();
};

window.toggleTheme = function () {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', state.theme);
  render();
};

window.revealSentence = function (key) {
  state.revealed[key] = (state.revealed[key] || 0) + 1;
  render();
  
  // Auto scroll למשפט החדש
  setTimeout(() => {
    const sentenceElements = document.querySelectorAll('.sentence-text');
    if (sentenceElements.length > 0) {
      const lastSentence = sentenceElements[sentenceElements.length - 1];
      lastSentence.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  }, 100);
};

window.showAllSentences = function (key) {
  // מציג את כל המשפטים בסעיף
  const [qid, sidx] = key.split('_');
  const section = questions[state.tab].sections[parseInt(sidx)];
  state.revealed[key] = section.sentences.length;
  render();
};

window.showNextSentence = function (key) {
  // מציג את המשפט הבא (מה שהצג עשה קודם)
  state.revealed[key] = (state.revealed[key] || 0) + 1;
  render();
  
  // Auto scroll למשפט החדש עם אנימציה
  setTimeout(() => {
    const sentenceElements = document.querySelectorAll('.sentence-text');
    if (sentenceElements.length > 0) {
      const lastSentence = sentenceElements[sentenceElements.length - 1];
      
      // הוסף אפקט הדגשה למשפט החדש
      lastSentence.style.animation = 'pulse 1s ease-in-out';
      
      lastSentence.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // הסר את האנימציה אחרי שנייה
      setTimeout(() => {
        lastSentence.style.animation = '';
      }, 1000);
    }
  }, 100);
};

window.clearAllSentences = function (key) {
  // מנקה את כל המשפטים בסעיף
  state.revealed[key] = 0;
  render();
};

window.updateAnswer = function (key, idx, val) {
  if (!state.answers[key]) state.answers[key] = Array(questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key).sentences.length).fill('');
  state.answers[key][idx] = val;
  
  // שמור את הפוקוס הנוכחי
  const activeElement = document.activeElement;
  const activeKey = activeElement ? activeElement.getAttribute('data-key') : null;
  const activeIdx = activeElement ? parseInt(activeElement.getAttribute('data-idx')) : null;
  const cursorPosition = activeElement ? activeElement.selectionStart : 0;
  const scrollPosition = window.scrollY;
  
  // בדוק אם התשובה נכונה ב-100%
  const sentence = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key).sentences[idx];
  const accuracy = compareSentences(val, sentence);
  
  if (accuracy === 100) {
    // הוסף אפקט הצלחה
    const inputElement = document.querySelector(`input[data-key="${key}"][data-idx="${idx}"]`);
    if (inputElement) {
      inputElement.classList.add('success');
      setTimeout(() => {
        inputElement.classList.remove('success');
      }, 2000);
    }
  }
  
  // בדוק אם כל המשפטים בסעיף נכונים
  const section = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key);
  const allCorrect = section.sentences.every((s, i) => {
    const acc = compareSentences(state.answers[key][i] || '', s);
    return acc === 100;
  });
  
  if (allCorrect) {
    // הפעל קונפטי
    createConfetti();
  }
  
  // עדכן רק את האלמנט הספציפי במקום רינדור מלא
  updateSingleInput(key, idx, val);
  
  // החזר את הפוקוס והגלילה
  setTimeout(() => {
    if (activeKey && activeIdx !== null) {
      const newActiveElement = document.querySelector(`input[data-key="${activeKey}"][data-idx="${activeIdx}"]`);
      if (newActiveElement) {
        newActiveElement.focus();
        newActiveElement.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
    // החזר את מיקום הגלילה
    window.scrollTo(0, scrollPosition);
  }, 0);
};

window.scrollTabs = function (direction) {
  const tabsContainer = document.querySelector('.tabs-left');
  if (!tabsContainer) return;
  
  const scrollAmount = 200; // גלול 200px בכל פעם
  const currentScroll = tabsContainer.scrollLeft;
  
  if (direction === 'left') {
    tabsContainer.scrollTo({
      left: currentScroll - scrollAmount,
      behavior: 'smooth'
    });
  } else {
    tabsContainer.scrollTo({
      left: currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  }
};


render();

// החל את ה-theme כברירת מחדל
document.body.setAttribute('data-theme', state.theme);

// הוסף event listeners לטיפול בפוקוס
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('input-sentence')) {
    // שמור את הפוקוס על האינפוט שנלחץ
    e.target.focus();
  }
}); 