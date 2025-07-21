const app = document.getElementById('app');
const questions = window.gmdssQuestions;
const americanQuestions = window.americanQuestions || [];

// יצירת טאב שאלות מצוקה עם ניווט פנימי
const distressQuestions = questions.slice(0, 13); // שאלות 1-13
const otherQuestions = questions.slice(13); // שאר השאלות

// יצירת טאב חדש לשאלות מצוקה
const distressTab = {
  id: 'distress',
  title: 'שאלות מצוקה',
  type: 'distress',
  description: 'שאלות בנושא מצוקה',
  questions: distressQuestions
};

// הוספת טאב סימולטורים
const simulatorsTab = {
  id: 'simulators',
  title: 'סימולטורים',
  type: 'simulators',
  description: 'הורדת קבצי סימולטור'
};

// יצירת רשימת טאבים חדשה
const tabs = [
  distressTab,
  ...otherQuestions,
  simulatorsTab
];

console.log('Distress questions loaded:', distressQuestions.length);
console.log('Other questions loaded:', otherQuestions.length);
console.log('American questions loaded:', americanQuestions);
console.log('American questions length:', americanQuestions.length);
console.log('Tabs created:', tabs.length);

// Add new state for the American Exam
let state = {
  tab: 0,
  mode: 'basic', // 'basic' | 'advanced'
  theme: 'light', // 'light' | 'dark'
  revealed: {}, // { [questionId_sectionIdx]: numRevealed }
  answers: {}, // { [questionId_sectionIdx]: userAnswers }
  americanAnswers: {}, // { [questionId]: selectedOption }
  americanQuestionIndex: 0, // Track current American question index
  distressQuestionIndex: 0, // Track current distress question index
  distressAutoAdvance: false, // Auto advance for distress questions
  distressAutoAdvanceSeconds: 5, // Seconds to wait before auto advance
  autoAdvance: false, // Auto advance between questions
  autoAdvanceSeconds: 5, // Seconds to wait before auto advance
  americanExamQuestions: [], // 25 random questions for the exam
  americanExamAnswers: {}, // { [questionId]: selectedOption }
  americanExamIndex: 0, // Current index in the exam
  americanExamFinished: false, // Exam finished flag
};

function isEnglish(str) {
      // Check if there are Hebrew characters in the sentence
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
  
      // Regular: MAYDAY X3 -> MAYDAY MAYDAY MAYDAY
  return sentence.replace(/([A-Z]+) X3/, '$1 $1 $1');
}

function isRadioCommunication(sentence) {
  // For questions 1-13 (distress messages), highlight all sentences
  const currentQuestionId = state.tab < questions.length ? questions[state.tab].id : null;
  if (currentQuestionId && currentQuestionId >= 1 && currentQuestionId <= 13) {
    return true;
  }
  
  // For other questions, use the original logic
  const radioKeywords = [
    'MAYDAY', 'OVER', 'OUT', 'THIS IS', 'ALL STATION', 'ALL STATIONS',
    'SEELONCE', 'FEENEE', 'RECEIVED', 'MMSI', 'UTC',
    // Ship names
    'TOMA', 'GATO', 'RONI', 'ALASKA',
    // Location
    'DEGREES', 'MINUTES', 'NORTH', 'SOUTH', 'EAST', 'WEST',
    // Ship status (only in communication sentences)
    'DISABLED AND DRIFTING', 'FIRE ON BOARD', 'TAKING WATER',
    'IN DANGER OF SINKING',
    // Help requests
    'REQUIRE IMMEDIATE ASSISTANCE',
    // Number of people
    'PERSONS ON BOARD'
  ];
  return radioKeywords.some(keyword => sentence.includes(keyword));
}

function getSectionKey(qid, sidx) {
  return `${qid}_${sidx}`;
}

    // Function to copy text to clipboard
  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      // Use modern clipboard API
      navigator.clipboard.writeText(text).then(() => {
        showCopyFeedback();
      }).catch(err => {
        console.error('Failed to copy: ', err);
        fallbackCopyTextToClipboard(text);
      });
    } else {
      // Fallback for older browsers
      fallbackCopyTextToClipboard(text);
    }
  }
  
  // Fallback copy function
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showCopyFeedback();
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
    
    document.body.removeChild(textArea);
  }
  
  // Show copy feedback
  function showCopyFeedback() {
    const feedback = document.createElement('div');
    feedback.textContent = 'Copied!';
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--md-success);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translate(-50%, -50%) scale(0.8)';
      feedback.style.transition = 'all 0.3s ease';
      
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 300);
    }, 1000);
  }
  
  // Function to create confetti
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
  // שלושה טאבים בלבד: שאלות מצוקה, מבחן אמריקאי, סימולטורים
  const tabNames = [
    { label: 'שאלות מצוקה', index: 0 },
    { label: 'מאגר שאלות', index: 1 },
    { label: 'מבחן אמריקאי', index: 2 },
    { label: 'סימולטורים', index: 3 }
  ];
  return `<div class="header-container">
    <div class="tabs">
      <div class="tabs-left">
        ${tabNames.map((tab, i) =>
          `<button class="tab${state.tab === i ? ' active' : ''}" onclick="selectTab(${i})">${tab.label}</button>`
        ).join('')}
      </div>
    </div>
    <div class="theme-toggle-top">
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
      // Basic similarity calculation (Levenshtein or simple)
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
  
      // Check if all sentences are 100% correct
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
          <textarea class="input-sentence" style="direction:${direction};text-align:${textAlign};text-transform:${textTransform};font-weight:${isRadio ? 'bold' : 'normal'};resize:none;min-height:60px;" oninput="updateAnswer('${key}',${idx},this.value)" data-key="${key}" data-idx="${idx}" rows="3">${val.replace(/"/g, '&quot;')}</textarea>
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

function renderDistressQuestions() {
  const isMobile = window.innerWidth <= 768;
  const currentQuestionIndex = state.distressQuestionIndex || 0;
  const currentQuestion = distressQuestions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return `
      <div class="content">
        <div class="distress-test-container">
          <div class="distress-test-header">
            <h2>שאלות מצוקה</h2>
            <p>בחר שאלה מהרשימה למטה</p>
          </div>
          <div class="distress-questions-list">
            ${distressQuestions.map((q, index) => `
              <button 
                class="question-selector ${state.distressQuestionIndex === index ? 'active' : ''}"
                onclick="selectDistressQuestion(${index})"
              >
                שאלה ${index + 1}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  // סרגל ניווט עליון עם כל הפיצ'רים (כמו באמריקאי)
  let topNav = '';
  if (!isMobile) {
    topNav = `
      <div class="quick-nav-buttons top">
        <div class="nav-left">
          <button 
            class="quick-nav-btn" 
            onclick="previousDistressQuestion()"
            ${currentQuestionIndex === 0 ? 'disabled' : ''}
            title="שאלה קודמת"
          >
            &#x25B6;
          </button>
        </div>
        <span class="question-counter">${distressQuestions.length} / ${currentQuestionIndex + 1}</span>
        <div class="nav-right">
          <button 
            class="quick-nav-btn" 
            onclick="nextDistressQuestion()"
            ${currentQuestionIndex === distressQuestions.length - 1 ? 'disabled' : ''}
            title="שאלה הבאה"
          >
            &#x25C0;
          </button>
        </div>
      </div>
    `;
  }
  
  // ניווט תחתון במובייל
  let bottomNav = '';
  if (isMobile) {
    bottomNav = `
      <div class="bottom-nav-bar">
        <button class="bottom-nav-btn" onclick="previousDistressQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''} title="שאלה קודמת">&#x25B6;</button>
        <span class="bottom-nav-counter">${distressQuestions.length} / ${currentQuestionIndex + 1}</span>
        <button class="bottom-nav-btn" onclick="nextDistressQuestion()" ${currentQuestionIndex === distressQuestions.length - 1 ? 'disabled' : ''} title="שאלה הבאה">&#x25C0;</button>
      </div>
    `;
  }
  
  return `
    <div class="content">
      ${topNav}
      ${bottomNav}
      <div class="distress-question-container">
        <div class="distress-question">
          <div class="question-header">
            <div class="question-title">${currentQuestion.title}</div>
            <div class="mode-toggle">
              <label class="toggle-mode">
                <input type="checkbox" ${state.mode === 'advanced' ? 'checked' : ''} onchange="toggleMode()">
                <span class="toggle-slider"></span>
              </label>
              <span class="mode-toggle-text">${state.mode === 'advanced' ? '✏️' : '👁️'}</span>
            </div>
          </div>
          <div class="question-description">${currentQuestion.description}</div>
          ${currentQuestion.sections
            .map((section, sidx) => {
              const sectionContent = state.mode === 'basic'
                ? renderBasicSection(section, currentQuestion.id, sidx)
                : renderAdvancedSection(section, currentQuestion.id, sidx);
              
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
      </div>
    </div>
  `;
}

function renderSimulators() {
  return `
    <div class="content">
      <div class="simulators-container">
        <div class="simulators-header">
          <h2>סימולטורים</h2>
          <p>הורדת קבצי סימולטור לתרגול</p>
        </div>
        <div class="simulators-list">
          <div class="simulator-item">
            <h3>EPIRB Simulator</h3>
            <p>סימולטור למשואת מצוקה EPIRB</p>
            <a href="simulators/epirb simulator.exe" download class="download-btn">
              הורד סימולטור EPIRB
            </a>
          </div>
          <div class="simulator-item">
            <h3>RADAR-SART Simulator</h3>
            <p>סימולטור למשואת מצוקה RADAR-SART</p>
            <a href="simulators/radar-sart simulator.exe" download class="download-btn">
              הורד סימולטור RADAR-SART
            </a>
          </div>
          <div class="simulator-item">
            <h3>NAVTEX Simulator</h3>
            <p>סימולטור למערכת NAVTEX</p>
            <a href="simulators/navtex simulator.exe" download class="download-btn">
              הורד סימולטור NAVTEX
            </a>
          </div>
          <div class="simulator-item">
            <h3>Portable VHF Simulator</h3>
            <p>סימולטור למכשיר VHF נייד</p>
            <a href="simulators/portable vhf simulator.exe" download class="download-btn">
              הורד סימולטור Portable VHF
            </a>
          </div>
          <div class="simulator-item">
            <h3>VHF DSC Simulator</h3>
            <p>סימולטור למערכת VHF DSC</p>
            <a href="simulators/vhfdsc simulator.exe" download class="download-btn">
              הורד סימולטור VHF DSC
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAmericanTest() {
  const isMobile = window.innerWidth <= 768;
  const currentQuestionIndex = state.americanQuestionIndex || 0;
  const currentQuestion = americanQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    return `
      <div class="content">
        <div class="american-test-container">
          <div class="american-test-header">
            <h2>מבחן אמריקאי</h2>
            <p>בחר שאלה מהרשימה למטה</p>
          </div>
          <div class="american-questions-list">
            ${americanQuestions.map((q, index) => `
              <button 
                class="question-selector ${state.americanQuestionIndex === index ? 'active' : ''}"
                onclick="selectAmericanQuestion(${index})"
              >
                שאלה ${index + 1}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  const selectedAnswer = state.americanAnswers[currentQuestion.id];
  
  // סרגל ניווט עליון עם כל הפיצ'רים
  let topNav = '';
  if (!isMobile) {
    topNav = `
      <div class="quick-nav-buttons top">
        <div class="nav-left">
          <button 
            class="quick-nav-btn" 
            onclick="previousAmericanQuestion()"
            ${currentQuestionIndex === 0 ? 'disabled' : ''}
            title="שאלה קודמת"
          >
            &#x25B6;
          </button>
          <button 
            class="quick-nav-btn" 
            onclick="previousAmericanQuestionBy10()"
            ${currentQuestionIndex < 10 ? 'disabled' : ''}
            title="10 שאלות אחורה"
          >
            &#x226A;
          </button>
        </div>
        <span class="question-counter">${americanQuestions.length} / ${currentQuestionIndex + 1}</span>
        <div class="nav-right">
          <button 
            class="quick-nav-btn" 
            onclick="nextAmericanQuestionBy10()"
            ${currentQuestionIndex >= americanQuestions.length - 10 ? 'disabled' : ''}
            title="10 שאלות קדימה"
          >
            &#x226B;
          </button>
          <button 
            class="quick-nav-btn" 
            onclick="nextAmericanQuestion()"
            ${currentQuestionIndex === americanQuestions.length - 1 ? 'disabled' : ''}
            title="שאלה הבאה"
          >
            &#x25C0;
          </button>
          <div class="auto-advance-section">
            <select onchange="setAutoAdvanceSeconds(parseInt(this.value))" class="auto-advance-select">
              <option value="0" ${!state.autoAdvance ? 'selected' : ''}>Off</option>
              <option value="1" ${state.autoAdvance && state.autoAdvanceSeconds === 1 ? 'selected' : ''}>1s</option>
              <option value="3" ${state.autoAdvance && state.autoAdvanceSeconds === 3 ? 'selected' : ''}>3s</option>
              <option value="5" ${state.autoAdvance && state.autoAdvanceSeconds === 5 ? 'selected' : ''}>5s</option>
              <option value="10" ${state.autoAdvance && state.autoAdvanceSeconds === 10 ? 'selected' : ''}>10s</option>
              <option value="15" ${state.autoAdvance && state.autoAdvanceSeconds === 15 ? 'selected' : ''}>15s</option>
              <option value="30" ${state.autoAdvance && state.autoAdvanceSeconds === 30 ? 'selected' : ''}>30s</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
  
  // ניווט תחתון במובייל
  let bottomNav = '';
  if (isMobile) {
    bottomNav = `
      <div class="bottom-nav-bar">
        <button class="bottom-nav-btn" onclick="previousAmericanQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''} title="שאלה קודמת">&#x25B6;</button>
        <button class="bottom-nav-btn" onclick="previousAmericanQuestionBy10()" ${currentQuestionIndex < 10 ? 'disabled' : ''} title="10 שאלות אחורה">&#x226A;</button>
        <span class="bottom-nav-counter">${americanQuestions.length} / ${currentQuestionIndex + 1}</span>
        <button class="bottom-nav-btn" onclick="nextAmericanQuestionBy10()" ${currentQuestionIndex >= americanQuestions.length - 10 ? 'disabled' : ''} title="10 שאלות קדימה">&#x226B;</button>
        <button class="bottom-nav-btn" onclick="nextAmericanQuestion()" ${currentQuestionIndex === americanQuestions.length - 1 ? 'disabled' : ''} title="שאלה הבאה">&#x25C0;</button>
        <div class="bottom-nav-auto">
          <select onchange="setAutoAdvanceSeconds(parseInt(this.value))" class="bottom-nav-auto-select">
            <option value="0" ${!state.autoAdvance ? 'selected' : ''}>Off</option>
            <option value="1" ${state.autoAdvance && state.autoAdvanceSeconds === 1 ? 'selected' : ''}>1s</option>
            <option value="3" ${state.autoAdvance && state.autoAdvanceSeconds === 3 ? 'selected' : ''}>3s</option>
            <option value="5" ${state.autoAdvance && state.autoAdvanceSeconds === 5 ? 'selected' : ''}>5s</option>
            <option value="10" ${state.autoAdvance && state.autoAdvanceSeconds === 10 ? 'selected' : ''}>10s</option>
            <option value="15" ${state.autoAdvance && state.autoAdvanceSeconds === 15 ? 'selected' : ''}>15s</option>
            <option value="30" ${state.autoAdvance && state.autoAdvanceSeconds === 30 ? 'selected' : ''}>30s</option>
          </select>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="content">
      ${topNav}
      ${bottomNav}
      <div class="american-question-container">
        <div class="american-question">
          <h3 class="question-text">${currentQuestion.question}</h3>
          <div class="options-container">
            ${currentQuestion.options.map(option => {
              const isSelected = selectedAnswer === option.id;
              const isCorrect = option.correct;
              const showResult = selectedAnswer !== undefined;
              let optionClass = 'option-button';
              if (showResult) {
                if (isCorrect) {
                  optionClass += ' correct';
                } else if (isSelected && !isCorrect) {
                  optionClass += ' incorrect';
                }
              } else if (isSelected) {
                optionClass += ' selected';
              }
              return `
                <button 
                  class="${optionClass}"
                  onclick="selectAmericanAnswer('${currentQuestion.id}', '${option.id}')"
                  ${showResult ? 'disabled' : ''}
                >
                  <span class="option-letter">${option.id.toUpperCase()}</span>
                  <span class="option-text">${option.text}</span>
                  ${showResult && isCorrect ? '<span class="correct-icon">✓</span>' : ''}
                  ${showResult && isSelected && !isCorrect ? '<span class="incorrect-icon">✗</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAmericanQuestion(q) {
  const selectedAnswer = state.americanAnswers[q.id];
  const correctAnswer = q.options.find(opt => opt.correct);
  
  return `
    <div class="content">
      <div class="sticky-question">
        <div class="question-header">
          <div class="question-title">${q.title}</div>
          <div class="mode-toggle">
            <label class="toggle-mode">
              <input type="checkbox" ${state.mode === 'advanced' ? 'checked' : ''} onchange="toggleMode()">
              <span class="toggle-slider"></span>
            </label>
            <span class="mode-toggle-text">${state.mode === 'advanced' ? '✏️' : '👁️'}</span>
          </div>
        </div>
      </div>
      
      <div class="american-question-container">
        <div class="american-question">
          <h3 class="question-text">${q.question}</h3>
          
          <div class="options-container">
            ${q.options.map(option => {
              const isSelected = selectedAnswer === option.id;
              const isCorrect = option.correct;
              const showResult = selectedAnswer !== undefined;
              
              let optionClass = 'option-button';
              if (showResult) {
                if (isCorrect) {
                  optionClass += ' correct';
                } else if (isSelected && !isCorrect) {
                  optionClass += ' incorrect';
                }
              } else if (isSelected) {
                optionClass += ' selected';
              }
              
              return `
                <button 
                  class="${optionClass}"
                  onclick="selectAmericanAnswer('${q.id}', '${option.id}')"
                  ${showResult ? 'disabled' : ''}
                >
                  <span class="option-letter">${option.id.toUpperCase()}</span>
                  <span class="option-text">${option.text}</span>
                  ${showResult && isCorrect ? '<span class="correct-icon">✓</span>' : ''}
                  ${showResult && isSelected && !isCorrect ? '<span class="incorrect-icon">✗</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
          

        </div>
      </div>
    </div>
  `;
}

function renderQuestion(q) {
  console.log('Rendering question:', q);
  console.log('Question type:', q.type);
  console.log('Rendering question with sections:', q.sections ? q.sections.length : 'no sections');
  console.log('Question description:', q.description);
  
  // Check if this is a distress tab
  if (q.type === 'distress') {
    console.log('Rendering distress tab');
    return renderDistressQuestions();
  }
  
  // Check if this is a simulators tab
  if (q.type === 'simulators') {
    console.log('Rendering simulators tab');
    return renderSimulators();
  }
  
  // Check if this is an American question
  if (q.type === 'multiple_choice') {
    return renderAmericanQuestion(q);
  }
  
  return `
    <div class="content">
      <div class="sticky-question">
        <div class="question-header">
          <div class="question-title">${q.title}</div>
          <div class="mode-toggle">
            <label class="toggle-mode">
              <input type="checkbox" ${state.mode === 'advanced' ? 'checked' : ''} onchange="toggleMode()">
              <span class="toggle-slider"></span>
            </label>
            <span class="mode-toggle-text">${state.mode === 'advanced' ? '✏️' : '👁️'}</span>
          </div>
        </div>
        <div class="question-description" style="padding: 15px; margin: 10px 0;">${q.description}</div>
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
  document.body.setAttribute('data-theme', state.theme);
  if (state.tab === 0) {
    app.innerHTML = `${renderTabs()}${renderDistressQuestions()}`;
  } else if (state.tab === 1) {
    app.innerHTML = `${renderTabs()}${renderAmericanTest()}`;
  } else if (state.tab === 2) {
    app.innerHTML = `${renderTabs()}${renderAmericanExam()}`;
  } else if (state.tab === 3) {
    app.innerHTML = `${renderTabs()}${renderSimulators()}`;
  }
  if (state.mode === 'advanced') {
    setTimeout(() => {
      const inputs = document.querySelectorAll('textarea.input-sentence');
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
  const currentScroll = window.scrollY;
  const scrollContainer = document.documentElement;
  scrollContainer.style.overflow = 'hidden';
  if (state.tab === 0) {
    app.innerHTML = `${renderTabs()}${renderDistressQuestions()}`;
  } else if (state.tab === 1) {
    app.innerHTML = `${renderTabs()}${renderAmericanTest()}`;
  } else if (state.tab === 2) {
    app.innerHTML = `${renderTabs()}${renderAmericanExam()}`;
  } else if (state.tab === 3) {
    app.innerHTML = `${renderTabs()}${renderSimulators()}`;
  }
  if (state.mode === 'advanced') {
    const inputs = document.querySelectorAll('textarea.input-sentence');
    inputs.forEach(input => {
      const key = input.getAttribute('data-key');
      const idx = parseInt(input.getAttribute('data-idx'));
      if (key && state.answers[key] && state.answers[key][idx] !== undefined) {
        input.value = state.answers[key][idx];
      }
    });
  }
  requestAnimationFrame(() => {
    window.scrollTo(0, currentScroll);
    scrollContainer.style.overflow = '';
  });
}

function updateSingleInput(key, idx, val) {
  // Update only the specific element
  const inputElement = document.querySelector(`textarea[data-key="${key}"][data-idx="${idx}"]`);
  if (inputElement) {
    inputElement.value = val;
    
    // Update accuracy percentage
    let sentence;
    if (state.tab === 0) {
      // שאלות מצוקה
      const currentQuestion = distressQuestions[state.distressQuestionIndex];
      const section = currentQuestion.sections.find((s, i) => getSectionKey(currentQuestion.id, i) === key);
      sentence = section.sentences[idx];
    } else {
      // טאב אחר (אמריקאי/אחר)
      const section = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key);
      sentence = section.sentences[idx];
    }
    const accuracy = compareSentences(val, sentence);
    const accuracyElement = inputElement.parentElement.querySelector('.accuracy');
    if (accuracyElement) {
      accuracyElement.textContent = val ? accuracy + '%' : '';
      accuracyElement.style.color = accuracy === 100 ? '#388e3c' : accuracy > 60 ? '#fbc02d' : '#d32f2f';
    }
    
    // Update the score
    updateScore(key);
  }
}

function updateScore(key) {
  let section;
  if (state.tab === 0) {
    // שאלות מצוקה
    const currentQuestion = distressQuestions[state.distressQuestionIndex];
    section = currentQuestion.sections.find((s, i) => getSectionKey(currentQuestion.id, i) === key);
  } else {
    // טאב אחר (אמריקאי/אחר)
    section = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key);
  }
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

// עדכון selectTab שיתאים למבנה החדש
window.selectTab = function (i) {
  state.tab = i;
  renderWithoutFocus();
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
  
  // Smart scroll to new sentence
  setTimeout(() => {
    const sentenceElements = document.querySelectorAll('.sentence-text');
    if (sentenceElements.length > 0) {
      const lastSentence = sentenceElements[sentenceElements.length - 1];
      
      // Smart scroll - only if the new sentence is not visible
      const sentenceRect = lastSentence.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (sentenceRect.bottom > windowHeight || sentenceRect.top < 0) {
        lastSentence.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
      
      // Additional scroll to show buttons at the bottom
      setTimeout(() => {
        const buttons = document.querySelectorAll('button[onclick*="showNextSentence"], button[onclick*="showAllSentences"], button[onclick*="clearAllSentences"]');
        if (buttons.length > 0) {
          const lastButton = buttons[buttons.length - 1];
          const buttonRect = lastButton.getBoundingClientRect();
          
          if (buttonRect.bottom > windowHeight) {
            lastButton.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'nearest'
            });
          }
        }
      }, 200);
    }
  }, 100);
};

window.showAllSentences = function (key) {
      // Show all sentences in the section
  const [qid, sidx] = key.split('_');
  let section;
  if (state.tab === 0) {
    // שאלות מצוקה
    const currentQuestion = distressQuestions[state.distressQuestionIndex];
    section = currentQuestion.sections[parseInt(sidx)];
  } else {
    // טאב אחר (אמריקאי/אחר)
    section = questions[state.tab].sections[parseInt(sidx)];
  }
  state.revealed[key] = section.sentences.length;
  render();
};

window.showNextSentence = function (key) {
      // Show the next sentence (what show did before)
  state.revealed[key] = (state.revealed[key] || 0) + 1;
  render();
  
      // Add highlight effect and smart scroll
  setTimeout(() => {
    const sentenceElements = document.querySelectorAll('.sentence-text');
    if (sentenceElements.length > 0) {
      const lastSentence = sentenceElements[sentenceElements.length - 1];
      
      // Add highlight effect to new sentence
      lastSentence.style.animation = 'pulse 1s ease-in-out';
      
      // Smart scroll - only if the new sentence is not visible
      const sentenceRect = lastSentence.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (sentenceRect.bottom > windowHeight || sentenceRect.top < 0) {
        lastSentence.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
      
      // Additional scroll to show buttons at the bottom
      setTimeout(() => {
        const buttons = document.querySelectorAll('button[onclick*="showNextSentence"], button[onclick*="showAllSentences"], button[onclick*="clearAllSentences"]');
        if (buttons.length > 0) {
          const lastButton = buttons[buttons.length - 1];
          const buttonRect = lastButton.getBoundingClientRect();
          
          if (buttonRect.bottom > windowHeight) {
            lastButton.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest',
              inline: 'nearest'
            });
          }
        }
      }, 200);
      
      // Remove animation after one second
      setTimeout(() => {
        lastSentence.style.animation = '';
      }, 1000);
    }
  }, 100);
};

window.clearAllSentences = function (key) {
      // Clear all sentences in the section
  state.revealed[key] = 0;
  render();
};

window.updateAnswer = function (key, idx, val) {
  let section, sentence;
  // נזהה אם אנחנו בטאב שאלות מצוקה
  if (state.tab === 0) {
    // שאלות מצוקה
    const currentQuestion = distressQuestions[state.distressQuestionIndex];
    section = currentQuestion.sections.find((s, i) => getSectionKey(currentQuestion.id, i) === key);
    sentence = section.sentences[idx];
    if (!state.answers[key]) state.answers[key] = Array(section.sentences.length).fill('');
  } else {
    // טאב אחר (אמריקאי/אחר)
    section = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key);
    sentence = section.sentences[idx];
    if (!state.answers[key]) state.answers[key] = Array(section.sentences.length).fill('');
  }
  state.answers[key][idx] = val;
  
  // Save current focus
  const activeElement = document.activeElement;
  const activeKey = activeElement ? activeElement.getAttribute('data-key') : null;
  const activeIdx = activeElement ? parseInt(activeElement.getAttribute('data-idx')) : null;
  const cursorPosition = activeElement ? activeElement.selectionStart : 0;
  const scrollPosition = window.scrollY;
  
  // Check if answer is 100% correct
  const accuracy = compareSentences(val, sentence);
  
  if (accuracy === 100) {
    // Add success effect
    const inputElement = document.querySelector(`input[data-key="${key}"][data-idx="${idx}"]`);
    if (inputElement) {
      inputElement.classList.add('success');
      setTimeout(() => {
        inputElement.classList.remove('success');
      }, 2000);
    }
  }
  
  // Check if all sentences in section are correct
  const allCorrect = section.sentences.every((s, i) => {
    const acc = compareSentences(state.answers[key][i] || '', s);
    return acc === 100;
  });
  
  if (allCorrect) {
    // Trigger confetti
    createConfetti();
  }
  
  // Update only the specific element instead of full render
  updateSingleInput(key, idx, val);
  
  // Restore focus and scroll
  setTimeout(() => {
    if (activeKey && activeIdx !== null) {
      const newActiveElement = document.querySelector(`input[data-key="${activeKey}"][data-idx="${activeIdx}"]`);
      if (newActiveElement) {
        newActiveElement.focus();
        newActiveElement.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
    // Restore scroll position
    window.scrollTo(0, scrollPosition);
  }, 0);
};

window.selectAmericanAnswer = function (questionId, optionId) {
  state.americanAnswers[questionId] = optionId;
  render();
  
  // Start auto advance timer when user selects an answer
  if (state.autoAdvance) {
    startAutoAdvanceTimer();
  }

  // אם המשתמש ענה על השאלה האחרונה - הצג את טאב סימולטורים
  if (state.americanQuestionIndex === americanQuestions.length - 1) {
    showSimulatorsTab();
  }
};

window.selectAmericanQuestion = function (index) {
  console.log('Selecting American question:', index);
  state.americanQuestionIndex = index;
  render();
};

window.previousAmericanQuestion = function () {
  console.log('Previous - Current index:', state.americanQuestionIndex);
  if (state.americanQuestionIndex > 0) {
    state.americanQuestionIndex--;
    console.log('Previous - New index:', state.americanQuestionIndex);
    render();
    
    // Stop auto advance timer when manually navigating
    if (state.autoAdvance) {
      stopAutoAdvance();
    }
  } else {
    console.log('Already at first question');
  }
};

window.nextAmericanQuestion = function () {
  console.log('Current index:', state.americanQuestionIndex);
  console.log('Total questions:', americanQuestions.length);
  if (state.americanQuestionIndex < americanQuestions.length - 1) {
    state.americanQuestionIndex++;
    console.log('New index:', state.americanQuestionIndex);
    render();
    
    // Stop auto advance timer when manually navigating
    if (state.autoAdvance) {
      stopAutoAdvance();
    }
  } else {
    console.log('Already at last question');
  }
};

window.previousAmericanQuestionBy10 = function () {
  console.log('Previous by 10 - Current index:', state.americanQuestionIndex);
  if (state.americanQuestionIndex >= 10) {
    state.americanQuestionIndex -= 10;
    console.log('Previous by 10 - New index:', state.americanQuestionIndex);
    render();
    
    // Stop auto advance timer when manually navigating
    if (state.autoAdvance) {
      stopAutoAdvance();
    }
  } else {
    console.log('Cannot go back 10 questions');
  }
};

window.nextAmericanQuestionBy10 = function () {
  console.log('Next by 10 - Current index:', state.americanQuestionIndex);
  console.log('Total questions:', americanQuestions.length);
  if (state.americanQuestionIndex < americanQuestions.length - 10) {
    state.americanQuestionIndex += 10;
    console.log('Next by 10 - New index:', state.americanQuestionIndex);
    render();
    
    // Stop auto advance timer when manually navigating
    if (state.autoAdvance) {
      stopAutoAdvance();
    }
  } else {
    console.log('Cannot go forward 10 questions');
  }
};

window.selectDistressQuestion = function (index) {
  console.log('Selecting distress question:', index);
  state.distressQuestionIndex = index;
  render();
};

window.previousDistressQuestion = function () {
  console.log('Previous distress - Current index:', state.distressQuestionIndex);
  if (state.distressQuestionIndex > 0) {
    state.distressQuestionIndex--;
    console.log('Previous distress - New index:', state.distressQuestionIndex);
    render();
  } else {
    console.log('Already at first distress question');
  }
};

window.nextDistressQuestion = function () {
  console.log('Next distress - Current index:', state.distressQuestionIndex);
  console.log('Total distress questions:', distressQuestions.length);
  if (state.distressQuestionIndex < distressQuestions.length - 1) {
    state.distressQuestionIndex++;
    console.log('Next distress - New index:', state.distressQuestionIndex);
    render();
  } else {
    console.log('Already at last distress question');
  }
};

window.previousDistressQuestionBy10 = function () {
  console.log('Previous distress by 10 - Current index:', state.distressQuestionIndex);
  if (state.distressQuestionIndex >= 10) {
    state.distressQuestionIndex -= 10;
    console.log('Previous distress by 10 - New index:', state.distressQuestionIndex);
    render();
  } else {
    console.log('Cannot go back 10 distress questions');
  }
};

window.nextDistressQuestionBy10 = function () {
  console.log('Next distress by 10 - Current index:', state.distressQuestionIndex);
  console.log('Total distress questions:', distressQuestions.length);
  if (state.distressQuestionIndex < distressQuestions.length - 10) {
    state.distressQuestionIndex += 10;
    console.log('Next distress by 10 - New index:', state.distressQuestionIndex);
    render();
  } else {
    console.log('Cannot go forward 10 distress questions');
  }
};

window.setDistressAutoAdvanceSeconds = function (seconds) {
  if (seconds === 0) {
    // Turn off auto advance
    state.distressAutoAdvance = false;
    state.distressAutoAdvanceSeconds = 0;
    stopDistressAutoAdvance();
  } else {
    // Turn on auto advance with selected seconds
    state.distressAutoAdvance = true;
    state.distressAutoAdvanceSeconds = seconds;
    stopDistressAutoAdvance();
  }
  render();
};

// Auto advance functionality for distress questions
let distressAutoAdvanceTimer = null;

function startDistressAutoAdvance() {
  if (state.distressAutoAdvance && state.tab === 0) {
    clearTimeout(distressAutoAdvanceTimer);
  }
}

function startDistressAutoAdvanceTimer() {
  if (state.distressAutoAdvance && state.tab === 0) {
    clearTimeout(distressAutoAdvanceTimer);
    distressAutoAdvanceTimer = setTimeout(() => {
      if (state.distressQuestionIndex < distressQuestions.length - 1) {
        state.distressQuestionIndex++;
        render();
        startDistressAutoAdvanceTimer();
      }
    }, state.distressAutoAdvanceSeconds * 1000);
  }
}

function stopDistressAutoAdvance() {
  if (distressAutoAdvanceTimer) {
    clearTimeout(distressAutoAdvanceTimer);
    distressAutoAdvanceTimer = null;
  }
}

// Auto advance functionality
let autoAdvanceTimer = null;

function startAutoAdvance() {
  if (state.autoAdvance && state.tab === 1) {
    clearTimeout(autoAdvanceTimer);
    // Don't start timer immediately - wait for user to select an answer
  }
}

function startAutoAdvanceTimer() {
  if (state.autoAdvance && state.tab === 1) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      if (state.americanQuestionIndex < americanQuestions.length - 1) {
        state.americanQuestionIndex++;
        render();
        // Don't restart timer automatically - wait for user to select answer
      }
    }, state.autoAdvanceSeconds * 1000);
  }
}

function stopAutoAdvance() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

window.toggleAutoAdvance = function () {
  state.autoAdvance = !state.autoAdvance;
  if (state.autoAdvance) {
    // Don't start timer immediately - wait for user to select an answer
  } else {
    stopAutoAdvance();
  }
  render();
};

window.setAutoAdvanceSeconds = function (seconds) {
  if (seconds === 0) {
    // Turn off auto advance
    state.autoAdvance = false;
    state.autoAdvanceSeconds = 0;
    stopAutoAdvance();
  } else {
    // Turn on auto advance with selected seconds
    state.autoAdvance = true;
    state.autoAdvanceSeconds = seconds;
    stopAutoAdvance();
    // Don't restart timer - wait for user to select an answer
  }
  render();
};

window.scrollTabs = function (direction) {
  const tabsContainer = document.querySelector('.tabs-left');
  if (!tabsContainer) return;
  
  const scrollAmount = 200; // Scroll 200px each time
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

window.scrollTabs = function (direction) {
  const tabsContainer = document.querySelector('.tabs-left');
  if (!tabsContainer) return;
  
  const scrollAmount = 200; // Scroll 200px each time
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

// פונקציה לחשיפת טאב סימולטורים בסיום מבחן
function showSimulatorsTab() {
  // מעבר לטאב סימולטורים (הטאב האחרון)
  state.tab = tabs.length - 1;
  render();
}

// Utility to get 25 random questions
function getRandomQuestions(arr, n) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// New render function for the American Exam (identical to renderAmericanTest, but only 25 random questions, no nav bars, and with a finish button)
function renderAmericanExam() {
  // Initialize 25 random questions if not already
  if (state.americanExamQuestions.length !== 25) {
    state.americanExamQuestions = getRandomQuestions(americanQuestions, 25);
    state.americanExamAnswers = {};
    state.americanExamIndex = 0;
    state.americanExamFinished = false;
  }
  const questions = state.americanExamQuestions;
  const idx = state.americanExamIndex;
  const current = questions[idx];
  if (state.americanExamFinished) {
    // Show score
    const correct = questions.filter(q => {
      const ans = state.americanExamAnswers[q.id];
      return q.options.find(o => o.id === ans && o.correct);
    }).length;
    const score = Math.round((correct / 25) * 100);
    // Select icon by score
    let finishIcon = '🏆';
    if (score >= 96) finishIcon = '🏆';
    else if (score >= 80) finishIcon = '😃';
    else if (score >= 60) finishIcon = '🙂';
    else finishIcon = '😢';
    // Confetti only for 96+
    setTimeout(() => { if (score >= 96 && typeof createConfetti === 'function') createConfetti(); }, 100);
    // Dark mode colors
    const isDark = state.theme === 'dark';
    const reviewBg = isDark ? '#23272e' : '#f8fafc';
    const reviewBorder = isDark ? '#333a44' : '#e0e0e0';
    const reviewText = isDark ? '#e3eaf7' : '#222';
    const correctBg = isDark ? '#1b3c1b' : '#e8f5e9';
    const correctBorder = isDark ? '#388e3c' : '#388e3c';
    const correctText = isDark ? '#7fff7f' : '#388e3c';
    const userWrongBg = isDark ? '#3a2323' : '#ffebee';
    const userWrongBorder = isDark ? '#d32f2f' : '#d32f2f';
    const userWrongText = isDark ? '#ff7f7f' : '#d32f2f';
    const rightBg = isDark ? '#1e2a38' : '#e3f2fd';
    const rightBorder = isDark ? '#1976d2' : '#1976d2';
    const rightText = isDark ? '#90caf9' : '#1976d2';
    // Review block
    const reviewHtml = questions.map((q, i) => {
      const userAns = state.americanExamAnswers[q.id];
      return `<div style='margin-bottom:28px;padding:18px 16px 10px 16px;background:${reviewBg};border-radius:14px;box-shadow:0 1px 6px #0002;border:1px solid ${reviewBorder};color:${reviewText};'>
        <div style='font-weight:600;font-size:1.08em;margin-bottom:8px;'>${i+1}. ${q.question}</div>
        <div style='display:flex;flex-direction:column;gap:7px;'>
          ${q.options.map(opt => {
            const isCorrect = opt.correct;
            const isUser = userAns === opt.id;
            let style = `padding:7px 12px;border-radius:7px;border:1px solid ${reviewBorder};display:flex;align-items:center;gap:8px;background:${isDark ? '#181c20' : '#fff'};color:${reviewText};`;
            if (isCorrect && isUser) style += `background:${correctBg};border:2px solid ${correctBorder};color:${correctText};font-weight:700;`;
            else if (isCorrect) style += `background:${rightBg};border:2px solid ${rightBorder};color:${rightText};font-weight:700;`;
            else if (isUser) style += `background:${userWrongBg};border:2px solid ${userWrongBorder};color:${userWrongText};font-weight:700;`;
            return `<div style='${style}'>
              <span style='font-family:monospace;font-size:1.1em;'>${opt.id.toUpperCase()}</span>
              <span>${opt.text}</span>
              ${isCorrect ? '<span style=\'margin-right:auto;font-size:1.2em;\'>✓</span>' : ''}
              ${isUser && !isCorrect ? '<span style=\'margin-right:auto;font-size:1.2em;\'>✗</span>' : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');
    return `<div class="content">
      <div class="american-exam-finish" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;">
        <div style="background:${isDark ? '#23272e' : 'linear-gradient(120deg,#e3f2fd,#fffde7)'};padding:40px 32px 32px 32px;border-radius:24px;box-shadow:0 4px 32px #0002;display:flex;flex-direction:column;align-items:center;max-width:600px;width:100%;color:${reviewText};">
          <div style="font-size:3em;line-height:1;margin-bottom:12px;">${finishIcon}</div>
          <div style="font-size:2em;font-weight:800;color:#1976d2;text-shadow:0 2px 8px #1976d233;margin-bottom:12px;letter-spacing:1px;">סיימת את המבחן!</div>
          <div class="score" style="font-size:2.2em;font-weight:800;color:#388e3c;background:${correctBg};padding:16px 38px 10px 38px;border-radius:16px;box-shadow:0 2px 8px #388e3c22;margin-bottom:8px;letter-spacing:1px;">${score}</div>
          <div style="font-size:1em;color:#888;margin-bottom:18px;">נכונות: 25 / ${correct}</div>
          <div style="width:100%;margin:24px 0 12px 0;max-height:50vh;overflow-y:auto;direction:rtl;text-align:right;">${reviewHtml}</div>
          <button onclick="restartAmericanExam()" class="restart-btn" style="margin-top:10px;padding:10px 28px;font-size:1.1em;background:#1976d2;color:#fff;border:none;border-radius:8px;box-shadow:0 2px 8px #1976d233;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#125ea2'" onmouseout="this.style.background='#1976d2'">נסה שוב</button>
        </div>
      </div>
    </div>`;
  }
  // Improved progress indicator
  const progress = ((idx + 1) / 25) * 100;
  return `<div class="content">
    <div class="american-exam-container">
      <div class="exam-progress-bar-container" style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div class="exam-progress-label" style="font-size:1.1em;font-weight:500;direction:rtl;">שאלה <span style='color:#1976d2;font-weight:bold;'>${idx + 1}</span> מתוך <span style='color:#1976d2;font-weight:bold;'>25</span></div>
        <div class="exam-progress-bar-outer" style="flex:1;height:14px;background:#e0e0e0;border-radius:7px;overflow:hidden;box-shadow:0 1px 4px #0001;">
          <div class="exam-progress-bar-inner" style="height:100%;width:${progress}%;background:linear-gradient(90deg,#1976d2,#42a5f5);transition:width 0.3s;"></div>
        </div>
      </div>
      <div class="american-question">
        <h3 class="question-text">${current.question}</h3>
        <div class="options-container">
          ${current.options.map(option => {
            const isSelected = state.americanExamAnswers[current.id] === option.id;
            const isCorrect = option.correct;
            const showResult = state.americanExamAnswers[current.id] !== undefined;
            let optionClass = 'option-button';
            if (showResult) {
              if (isCorrect) {
                optionClass += ' correct';
              } else if (isSelected && !isCorrect) {
                optionClass += ' incorrect';
              }
            } else if (isSelected) {
              optionClass += ' selected';
            }
            return `
              <button 
                class="${optionClass}"
                onclick="selectAmericanExamAnswer('${current.id}', '${option.id}')"
                ${showResult ? 'disabled' : ''}
              >
                <span class="option-letter">${option.id.toUpperCase()}</span>
                <span class="option-text">${option.text}</span>
                ${showResult && isCorrect ? '<span class="correct-icon">✓</span>' : ''}
                ${showResult && isSelected && !isCorrect ? '<span class="incorrect-icon">✗</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

window.selectAmericanExamQuestion = function (index) {
  state.americanExamIndex = index;
  render();
};
window.selectAmericanExamAnswer = function (qid, oid) {
  state.americanExamAnswers[qid] = oid;
  // Auto-advance to next question or finish
  if (state.americanExamIndex < 24) {
    state.americanExamIndex++;
  } else {
    state.americanExamFinished = true;
  }
  render();
};
window.finishAmericanExam = function () {
  state.americanExamFinished = true;
  render();
};
window.restartAmericanExam = function () {
  state.americanExamQuestions = [];
  state.americanExamAnswers = {};
  state.americanExamIndex = 0;
  state.americanExamFinished = false;
  render();
};


render();

  // Apply theme as default
document.body.setAttribute('data-theme', state.theme);

// Prevent scroll to top on content changes
let savedScrollPosition = 0;
const observer = new MutationObserver(() => {
  if (savedScrollPosition > 0) {
    requestAnimationFrame(() => {
      window.scrollTo(0, savedScrollPosition);
    });
  }
});

observer.observe(document.getElementById('app'), {
  childList: true,
  subtree: true
});

// Save scroll position before any content change
document.addEventListener('scroll', () => {
  savedScrollPosition = window.scrollY;
});

    // Add event listeners for focus handling
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('input-sentence')) {
      // Save focus on the clicked textarea
      e.target.focus();
    }
    
    // Copy text on mobile tap
    if (e.target.classList.contains('sentence-text')) {
      copyTextToClipboard(e.target.textContent);
    }
  }); 