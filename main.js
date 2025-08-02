const app = document.getElementById('app');
const questions = window.gmdssQuestions;
const americanQuestions = window.americanQuestions || [];

// Audio Player State
let audioPlayerState = {
  currentTime: 0,
  isPlaying: false,
  volume: 1,
  muted: false,
  currentQuestion: 0
};

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

// הוספת טאב איות פונטי
const phoneticTab = {
  id: 'phonetic',
  title: 'איות פונטי',
  type: 'phonetic',
  description: 'מדריך לאלפבית הפונטי בתקשורת ימית'
};

// הוספת טאב סילבוס
const syllabusTab = {
  id: 'syllabus',
  title: 'סילבוס',
  type: 'syllabus',
  description: 'תוכנית הלימודים המלאה לקורס GMDSS'
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
  syllabusTab,
  distressTab,
  ...otherQuestions,
  phoneticTab,
  simulatorsTab
];



console.log('Distress questions loaded:', distressQuestions.length);
console.log('Other questions loaded:', otherQuestions.length);
console.log('American questions loaded:', americanQuestions);
console.log('American questions length:', americanQuestions.length);
console.log('Tabs created:', tabs.length);
console.log('Available tabs:', tabs.map(tab => tab.title || tab.id));

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
  americanExamQuestions: [], // Random questions for the exam
  americanExamAnswers: {}, // { [questionId]: selectedOption }
  americanExamIndex: 0, // Current index in the exam
  americanExamFinished: false, // Exam finished flag
  americanExamQuestionCount: 20, // Number of questions in the exam (default 25)
  americanExamHistory: [], // Array of completed exams
  sectionModes: {}, // { [questionId_sectionIdx]: 'basic' | 'advanced' }
  showExplanation: false, // Track if explanation modal is shown
  currentExplanation: '', // Current explanation text
  soundFeedback: true, // Enable/disable sound and vibration feedback
  savedScrollPosition: undefined, // Save scroll position for explanation modal
};

// User preferences management
const USER_PREFERENCES_KEY = 'gmdss_user_preferences';

// Load user preferences from localStorage
function loadUserPreferences() {
  try {
    const savedPreferences = localStorage.getItem(USER_PREFERENCES_KEY);
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      
      // Load theme
      if (preferences.theme) {
        state.theme = preferences.theme;
        document.body.setAttribute('data-theme', state.theme);
      }
      
      // Load mode
      if (preferences.mode) {
        state.mode = preferences.mode;
      }
      
      // Load auto-advance settings
      if (preferences.autoAdvance !== undefined) {
        state.autoAdvance = preferences.autoAdvance;
        console.log('Loaded autoAdvance:', state.autoAdvance);
      }
      if (preferences.autoAdvanceSeconds !== undefined) {
        state.autoAdvanceSeconds = preferences.autoAdvanceSeconds;
        console.log('Loaded autoAdvanceSeconds:', state.autoAdvanceSeconds);
      }
      
      // Load distress auto-advance settings
      if (preferences.distressAutoAdvance !== undefined) {
        state.distressAutoAdvance = preferences.distressAutoAdvance;
      }
      if (preferences.distressAutoAdvanceSeconds !== undefined) {
        state.distressAutoAdvanceSeconds = preferences.distressAutoAdvanceSeconds;
      }
      
      // Load current tab
      if (preferences.currentTab !== undefined) {
        state.tab = preferences.currentTab;
      }
      
      // Load current question indices
      if (preferences.distressQuestionIndex !== undefined) {
        state.distressQuestionIndex = preferences.distressQuestionIndex;
      }
      if (preferences.americanQuestionIndex !== undefined) {
        state.americanQuestionIndex = preferences.americanQuestionIndex;
      }
      if (preferences.americanExamQuestionCount !== undefined) {
        state.americanExamQuestionCount = preferences.americanExamQuestionCount;
      }
      if (preferences.americanExamHistory !== undefined) {
        state.americanExamHistory = preferences.americanExamHistory;
      }
      
      // Load sound feedback setting
      if (preferences.soundFeedback !== undefined) {
        state.soundFeedback = preferences.soundFeedback;
      }
      
      // Load section modes
      if (preferences.sectionModes) {
        state.sectionModes = preferences.sectionModes;
      }
      
      // Load saved scroll position
      if (preferences.savedScrollPosition !== undefined) {
        state.savedScrollPosition = preferences.savedScrollPosition;
      }
      
      console.log('User preferences loaded:', preferences);
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }
}

// Save user preferences to localStorage
function saveUserPreferences() {
  try {
    const preferences = {
      theme: state.theme,
      mode: state.mode,
      autoAdvance: state.autoAdvance,
      autoAdvanceSeconds: state.autoAdvanceSeconds,
      distressAutoAdvance: state.distressAutoAdvance,
      distressAutoAdvanceSeconds: state.distressAutoAdvanceSeconds,
      currentTab: state.tab,
      distressQuestionIndex: state.distressQuestionIndex,
      americanQuestionIndex: state.americanQuestionIndex,
      americanExamQuestionCount: state.americanExamQuestionCount,
      americanExamHistory: state.americanExamHistory,
      soundFeedback: state.soundFeedback,
      sectionModes: state.sectionModes,
      savedScrollPosition: state.savedScrollPosition
    };
    
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
    console.log('User preferences saved:', preferences);
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

// Clear user preferences (reset to defaults)
function clearUserPreferences() {
  try {
    localStorage.removeItem(USER_PREFERENCES_KEY);
    
    // Reset to defaults
    state.theme = 'light';
    state.autoAdvance = false;
    state.autoAdvanceSeconds = 5;
    state.distressAutoAdvance = false;
    state.distressAutoAdvanceSeconds = 5;
    state.tab = 0;
    state.distressQuestionIndex = 0;
    state.americanQuestionIndex = 0;
    state.americanExamQuestionCount = 20;
    
    document.body.setAttribute('data-theme', state.theme);
    console.log('User preferences cleared and reset to defaults');
  } catch (error) {
    console.error('Error clearing user preferences:', error);
  }
}

// Add global function to clear preferences
window.clearUserPreferences = clearUserPreferences;

// Add function to show current preferences
function showUserPreferences() {
  const preferences = {
    theme: state.theme === 'light' ? 'בהיר' : 'כהה',
    autoAdvance: state.autoAdvance ? 'מופעל' : 'כבוי',
    autoAdvanceSeconds: state.autoAdvanceSeconds,
    distressAutoAdvance: state.distressAutoAdvance ? 'מופעל' : 'כבוי',
    distressAutoAdvanceSeconds: state.distressAutoAdvanceSeconds,
    currentTab: ['שאלות מצוקה', 'מאגר שאלות', 'מבחן אמריקאי', 'איות פונטי', 'סימולטורים'][state.tab],
    distressQuestionIndex: state.distressQuestionIndex + 1,
    americanQuestionIndex: state.americanQuestionIndex + 1,
    americanExamQuestionCount: state.americanExamQuestionCount
  };
  
  const message = `
העדפות נוכחיות:
• ערכת נושא: ${preferences.theme}
• אוטו-אדוונס אמריקאי: ${preferences.autoAdvance} (${preferences.autoAdvanceSeconds} שניות)
• אוטו-אדוונס מצוקה: ${preferences.distressAutoAdvance} (${preferences.distressAutoAdvanceSeconds} שניות)
• טאב נוכחי: ${preferences.currentTab}
• שאלת מצוקה נוכחית: ${preferences.distressQuestionIndex}
• שאלה אמריקאית נוכחית: ${preferences.americanQuestionIndex}
• מספר שאלות במבחן אמריקאי: ${preferences.americanExamQuestionCount}

קיצורי מקלדת:
• Ctrl+Shift+P: הצג העדפות
• Ctrl+Shift+R: אפס העדפות
  `;
  
  console.log('Current preferences:', preferences);
  alert(message);
}

// Add global function to show preferences
window.showUserPreferences = showUserPreferences;

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
  const tabNames = ['סילבוס', 'שאלות מצוקה', 'מאגר שאלות', 'מבחן אמריקאי', 'איות פונטי', 'סימולטורים', 'חלק ב'];
  return `<div class="header-container">
    <div class="tabs">
      <div class="tabs-left">
        ${tabNames.map((name, i) =>
          `<button class="tab${state.tab === i ? ' active' : ''}" onclick="selectTab(${i})">${name}</button>`
        ).join('')}
      </div>
    </div>
    <div class="theme-toggle-top">
      <label class="theme-toggle-mode">
        <input type="checkbox" ${state.theme === 'dark' ? 'checked' : ''} onchange="toggleTheme()">
        <span class="theme-toggle-slider"></span>
      </label>
      <span class="theme-toggle-text">${state.theme === 'dark' ? '🌙' : '☀️'}</span>
      <label class="theme-toggle-mode" style="margin-left: 10px;">
        <input type="checkbox" ${state.soundFeedback ? 'checked' : ''} onchange="toggleSoundFeedback()">
        <span class="theme-toggle-slider"></span>
      </label>
      <span class="theme-toggle-text">${state.soundFeedback ? '🔊' : '🔇'}</span>
    </div>
  </div>`;
}



function renderBasicSection(section, qid, sidx) {
  const key = getSectionKey(qid, sidx);
  const revealed = state.revealed[key] || 0;
  
  return `
    ${section.sentences
      .map((sentence, idx) => {
        if (revealed >= section.sentences.length ? true : idx < revealed) {
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
  
  // Handle mobile keyboard visibility
  if (isMobile) {
    handleMobileKeyboard();
  }
  
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
  
  // נגן אודיו לכל שאלות המצוקה (1-13)
  let audioPlayer = '';
  if (currentQuestionIndex >= 0 && currentQuestionIndex < 13) {
    const questionNumber = currentQuestionIndex + 1;
    const audioFile = `audio/q${questionNumber}_ditress_audio.mp3`;
    audioPlayer = `
      <div class="audio-player-container">
        <div class="audio-player-header">
          <div class="audio-player-icon">🎵</div>
          <h3 class="audio-player-title">פודקסט שאלה ${questionNumber}</h3>
        </div>
        <div class="audio-player-controls">
          <audio id="audio-player" controls preload="metadata" style="width: 100%; height: 40px;">
            <source src="${audioFile}" type="audio/mpeg">
            הדפדפן שלך לא תומך בנגן אודיו.
          </audio>
        </div>
      </div>
    `;
  }
  
  // נוסיף כאן את התיאור בלבד מחוץ לקופסה, עם sticky למעלה וצל
  const questionHeader = `
    <div class="question-description sticky">
      ${currentQuestion.description}
    </div>
  `;

  return `
    <div class="content">
      ${topNav}
      ${bottomNav}
      ${audioPlayer}
      ${questionHeader}
      ${currentQuestion.sections
        .map((section, sidx) => {
          const sectionKey = getSectionKey(currentQuestion.id, sidx);
          const sectionMode = state.sectionModes ? (state.sectionModes[sectionKey] || 'basic') : (state.mode || 'basic');
          const sectionContent = sectionMode === 'basic'
            ? renderBasicSection(section, currentQuestion.id, sidx)
            : renderAdvancedSection(section, currentQuestion.id, sidx);
          return `
            <div class="section-container" style="position:relative;">
              <span class="section-mode-toggle" style="position:absolute;top:10px;left:16px;z-index:2;display:inline-flex;align-items:center;gap:6px;">
                <label class="toggle-mode" style="margin-bottom:-2px;">
                  <input type="checkbox" ${sectionMode === 'advanced' ? 'checked' : ''} onchange="toggleSectionMode('${sectionKey}')">
                  <span class="toggle-slider"></span>
                </label>
                <span class="mode-toggle-text">${sectionMode === 'advanced' ? '✏️' : '👁️'}</span>
              </span>
              <div class="section-header" style="display:flex;align-items:center;gap:12px;">
                <h3 class="section-title" style="margin:0; font-size:1.1em; font-weight:700; display:inline-block;">${section.label}</h3>
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

function renderPhoneticAlphabet() {
  return `
    <div class="content">
      <div class="phonetic-container">

        


        <div class="phonetic-section">
          <h3>טבלת האלפבית הפונטי (אותיות)</h3>
          <div class="phonetic-table-container">
            <table class="phonetic-table">
              <thead>
                <tr>
                  <th>אות</th>
                  <th>מילת קוד בינלאומית (ITU)</th>
                  <th>תעתיק עברי להגייה</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>A</td><td>Alfa</td><td>אַלְפָא</td></tr>
                <tr><td>B</td><td>Bravo</td><td>בְּרָאבוֹ</td></tr>
                <tr><td>C</td><td>Charlie</td><td>צָ'רְלִי</td></tr>
                <tr><td>D</td><td>Delta</td><td>דֶלְתָא</td></tr>
                <tr><td>E</td><td>Echo</td><td>אֶקוֹ</td></tr>
                <tr><td>F</td><td>Foxtrot</td><td>פוֹקְסְטְרוֹט</td></tr>
                <tr><td>G</td><td>Golf</td><td>גוֹלְף</td></tr>
                <tr><td>H</td><td>Hotel</td><td>הוֹטֶל</td></tr>
                <tr><td>I</td><td>India</td><td>אִינְדִיָּה</td></tr>
                <tr><td>J</td><td>Juliet</td><td>גָ'וּלְיֶט</td></tr>
                <tr><td>K</td><td>Kilo</td><td>קִילוֹ</td></tr>
                <tr><td>L</td><td>Lima</td><td>לִימָא</td></tr>
                <tr><td>M</td><td>Mike</td><td>מַיְק</td></tr>
                <tr><td>N</td><td>November</td><td>נוֹבֶמְבֶּר</td></tr>
                <tr><td>O</td><td>Oscar</td><td>אוֹסְקָר</td></tr>
                <tr><td>P</td><td>Papa</td><td>פָּאפָּא</td></tr>
                <tr><td>Q</td><td>Quebec</td><td>קְוֶבֶק</td></tr>
                <tr><td>R</td><td>Romeo</td><td>רוֹמְיוֹ</td></tr>
                <tr><td>S</td><td>Sierra</td><td>סִיֶרְרָא</td></tr>
                <tr><td>T</td><td>Tango</td><td>טַנְגוֹ</td></tr>
                <tr><td>U</td><td>Uniform</td><td>יוּנִיפוֹרְם</td></tr>
                <tr><td>V</td><td>Victor</td><td>וִיקְטוֹר</td></tr>
                <tr><td>W</td><td>Whiskey</td><td>וִיסְקִי</td></tr>
                <tr><td>X</td><td>X-ray</td><td>אֶקְס-רַי</td></tr>
                <tr><td>Y</td><td>Yankee</td><td>יַנְקִי</td></tr>
                <tr><td>Z</td><td>Zulu</td><td>זוּלוּ</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="phonetic-section">
          <h3>טבלת איות מספרים (ספרות)</h3>
          <div class="phonetic-table-container">
            <table class="phonetic-table">
              <thead>
                <tr>
                  <th>ספרה</th>
                  <th>מילת קוד בינלאומית (ITU)</th>
                  <th>תעתיק עברי להגייה</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>0</td><td>NADAZERO</td><td>נָאדָזִירוֹ</td></tr>
                <tr><td>1</td><td>UNAONE</td><td>אוּנָאוֹן</td></tr>
                <tr><td>2</td><td>BISSOTWO</td><td>בִּיסוֹטוֹ</td></tr>
                <tr><td>3</td><td>TERRATHREE</td><td>טֶרָאתְרִי</td></tr>
                <tr><td>4</td><td>KARTEFOUR</td><td>קָרְטֶפוֹר</td></tr>
                <tr><td>5</td><td>PANTAFIVE</td><td>פָנְטָפַיְב</td></tr>
                <tr><td>6</td><td>SOXISIX</td><td>סוֹקְסִיסִיקְס</td></tr>
                <tr><td>7</td><td>SETTESEVEN</td><td>סֶטֶסֶבֶן</td></tr>
                <tr><td>8</td><td>OKTOEIGHT</td><td>אוֹקְטוֹאַיְט</td></tr>
                <tr><td>9</td><td>NOVENINE</td><td>נוֹבֶנַיְן</td></tr>
                <tr><td>.</td><td>DECIMAL</td><td>דֶצִימָל</td></tr>
              </tbody>
            </table>
          </div>
        </div>



        <div class="phonetic-section">
          <h3>כללי שימוש חשובים</h3>
          <div class="phonetic-rules">
            <div class="rule-item">
              <span class="rule-number">1</span>
              <span class="rule-text"><strong>הגייה ברורה:</strong> יש לבטא כל מילת קוד בצורה ברורה ומדויקת</span>
            </div>
            <div class="rule-item">
              <span class="rule-number">2</span>
              <span class="rule-text"><strong>הפסקות:</strong> יש להשהות קלות בין מילות הקוד השונות</span>
            </div>
            <div class="rule-item">
              <span class="rule-number">3</span>
              <span class="rule-text"><strong>חזרה:</strong> במקרה של אי-הבנה, יש לחזור על המידע באיות פונטי</span>
            </div>
            <div class="rule-item">
              <span class="rule-number">4</span>
              <span class="rule-text"><strong>תרגול:</strong> יש לתרגל את השימוש באלפבית הפונטי באופן קבוע</span>
            </div>
            <div class="rule-item">
              <span class="rule-number">5</span>
              <span class="rule-text"><strong>סטנדרטיזציה:</strong> יש להשתמש רק במילות הקוד הרשמיות של ITU</span>
            </div>
          </div>
        </div>


      </div>
    </div>
  `;
}

function renderSyllabus() {
  return `
    <div class="content">
      <div class="syllabus-container">

                  <div class="syllabus-content">
            <div class="syllabus-description">
              <h3>תיאור הקורס</h3>
              <p>קורס GMDSS (Global Maritime Distress and Safety System) מכשיר מפעילים לתקשורת ימית בטוחה ומקצועית. הקורס כולל לימוד תיאורטי ומעשי של מערכות התקשורת הימיות, נהלי מצוקה ובטיחות.</p>
            </div>
            <div class="syllabus-topics">
              <h3>נושאי הקורס העיקריים</h3>
              <div class="topics-list">
                <div class="topic-item">
                  <span class="topic-icon">📻</span>
                  <span class="topic-text">מערכות GMDSS ורכיביהן</span>
                </div>
                <div class="topic-item">
                  <span class="topic-icon">🚨</span>
                  <span class="topic-text">נהלי מצוקה ודחיפות</span>
                </div>
                <div class="topic-item">
                  <span class="topic-icon">📡</span>
                  <span class="topic-text">תקשורת VHF, MF, HF</span>
                </div>
                <div class="topic-item">
                  <span class="topic-icon">🛰️</span>
                  <span class="topic-text">מערכות לווייניות (Inmarsat)</span>
                </div>
                <div class="topic-item">
                  <span class="topic-icon">📊</span>
                  <span class="topic-text">מערכות DSC (Digital Selective Calling)</span>
                </div>
                <div class="topic-item">
                  <span class="topic-icon">🔍</span>
                  <span class="topic-text">משואות מצוקה (EPIRB, SART)</span>
                </div>
                <div class="topic-item">
                  <span class="topic-icon">📰</span>
                  <span class="topic-text">מערכת NAVTEX</span>
                </div>
                <div class="topic-item">
                  <span class="topic-icon">📝</span>
                  <span class="topic-text">תיעוד ויומן רדיו</span>
                </div>
              </div>
            </div>
            <div class="syllabus-download">
              <h3>הורדת הסילבוס המלא</h3>
              <p>לחץ על הכפתור למטה כדי להוריד את הסילבוס המלא של הקורס בפורמט PDF:</p>
              <a href="CodeSyllabusLongTermOperatorCertificate.pdf" download class="syllabus-download-btn">
                📄 הורד סילבוס הקורס (PDF)
              </a>
            </div>
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
  console.log('renderAmericanTest called, showExplanation:', state.showExplanation, 'currentExplanation:', state.currentExplanation);
  const isMobile = window.innerWidth <= 768;
  const currentQuestionIndex = state.americanQuestionIndex || 0;
  const currentQuestion = americanQuestions[currentQuestionIndex];
  console.log('Current question:', currentQuestion);
  console.log('Current question explanation:', currentQuestion.explanation);
  if (!currentQuestion) {
    return `
      <div class="content">
        <div class="american-test-container">
          <div class="american-test-header">
            <h2>מאגר שאלות</h2>
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
  
  // סרגל ניווט עליון עם כל הפיצ'רים (כמו באמריקאי)
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
          <div class="question-header">
            <h3 class="question-text">${currentQuestion.question}</h3>
          </div>
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
          ${currentQuestion.explanation ? `
            <div class="explanation-button-container">
              <button 
                class="explanation-btn" 
                data-explanation="${currentQuestion.explanation.replace(/"/g, '&quot;')}"
                onclick="showExplanationFromData(this)"
                title="הסבר מפורט"
              >
                📖 הסבר מפורט
              </button>
            </div>
          ` : ''}
        </div>
      </div>
      ${state.showExplanation ? `
        <div class="explanation-modal-overlay" onclick="hideExplanation()">
          <div class="explanation-modal" onclick="event.stopPropagation()">
            <div class="explanation-header">
              <h3>הסבר מפורט</h3>
              <button class="explanation-close-btn" onclick="hideExplanation()">✕</button>
            </div>
            <div class="explanation-content">
              ${state.currentExplanation}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderAmericanQuestion(q) {
  console.log('renderAmericanQuestion called with:', q);
  console.log('Question explanation:', q.explanation);
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
          <div class="question-header">
            <h3 class="question-text">${q.question}</h3>
          </div>
          
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
          ${q.explanation ? `
            <div class="explanation-button-container">
              <button 
                class="explanation-btn" 
                data-explanation="${q.explanation.replace(/"/g, '&quot;')}"
                onclick="showExplanationFromData(this)"
                title="הסבר מפורט"
              >
                📖 הסבר מפורט
              </button>
            </div>
          ` : ''}
        </div>
      </div>
      ${state.showExplanation ? `
        <div class="explanation-modal-overlay" onclick="hideExplanation()">
          <div class="explanation-modal" onclick="event.stopPropagation()">
            <div class="explanation-header">
              <h3>הסבר מפורט</h3>
              <button class="explanation-close-btn" onclick="hideExplanation()">✕</button>
            </div>
            <div class="explanation-content">
              ${state.currentExplanation}
            </div>
          </div>
        </div>
      ` : ''}
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
        </div>
        <div class="question-description" style="padding: 15px; margin: 10px 0;">${q.description}</div>
      </div>
      ${q.sections
        .map((section, sidx) => {
          const sectionKey = getSectionKey(q.id, sidx);
          const sectionMode = state.sectionModes ? (state.sectionModes[sectionKey] || 'basic') : (state.mode || 'basic');
          const sectionContent = sectionMode === 'basic'
            ? renderBasicSection(section, q.id, sidx)
            : renderAdvancedSection(section, q.id, sidx);
          return `
            <div class="section-container" style="position:relative;">
              <span class="section-mode-toggle" style="position:absolute;top:10px;left:16px;z-index:2;display:inline-flex;align-items:center;gap:6px;">
                <label class="toggle-mode" style="margin-bottom:-2px;">
                  <input type="checkbox" ${sectionMode === 'advanced' ? 'checked' : ''} onchange="toggleSectionMode('${sectionKey}')">
                  <span class="toggle-slider"></span>
                </label>
                <span class="mode-toggle-text">${sectionMode === 'advanced' ? '✏️' : '👁️'}</span>
              </span>
              <div class="section-header" style="display:flex;align-items:center;gap:12px;">
                <h3 class="section-title" style="margin:0; font-size:1.1em; font-weight:700; display:inline-block;">${section.label}</h3>
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
  // Save audio player state before render
  saveAudioPlayerState();
  
  console.log('render called, tab:', state.tab, 'showExplanation:', state.showExplanation);
  document.body.setAttribute('data-theme', state.theme);
  if (state.tab === 0) {
    app.innerHTML = `${renderTabs()}${renderSyllabus()}`;
  } else if (state.tab === 1) {
    app.innerHTML = `${renderTabs()}${renderDistressQuestions()}`;
  } else if (state.tab === 2) {
    app.innerHTML = `${renderTabs()}${renderAmericanTest()}`;
  } else if (state.tab === 3) {
    app.innerHTML = `${renderTabs()}${renderAmericanExam()}`;
  } else if (state.tab === 4) {
    app.innerHTML = `${renderTabs()}${renderPhoneticAlphabet()}`;
  } else if (state.tab === 5) {
    app.innerHTML = `${renderTabs()}${renderSimulators()}`;
  } else if (state.tab === 6) {
    app.innerHTML = `${renderTabs()}${renderGmdssPart2()}`;
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
  
  // Restore audio player state after render
  setTimeout(() => {
    restoreAudioPlayerState();
  }, 100);
}

function renderWithoutFocus() {
  // Save audio player state before render
  saveAudioPlayerState();
  
  const currentScroll = window.scrollY;
  const scrollContainer = document.documentElement;
  scrollContainer.style.overflow = 'hidden';
  if (state.tab === 0) {
    app.innerHTML = `${renderTabs()}${renderSyllabus()}`;
  } else if (state.tab === 1) {
    app.innerHTML = `${renderTabs()}${renderDistressQuestions()}`;
  } else if (state.tab === 2) {
    app.innerHTML = `${renderTabs()}${renderAmericanTest()}`;
  } else if (state.tab === 3) {
    app.innerHTML = `${renderTabs()}${renderAmericanExam()}`;
  } else if (state.tab === 4) {
    app.innerHTML = `${renderTabs()}${renderPhoneticAlphabet()}`;
  } else if (state.tab === 5) {
    app.innerHTML = `${renderTabs()}${renderSimulators()}`;
  } else if (state.tab === 6) {
    app.innerHTML = `${renderTabs()}${renderGmdssPart2()}`;
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
    
    // Restore audio player state after render
    setTimeout(() => {
      restoreAudioPlayerState();
    }, 100);
  });
}



// GMDSS Part 2 Rendering Functions
function renderGmdssPart2() {
  const gmdssData = window.gmdssPart2Data;
  if (!gmdssData) return '<div>Error: GMDSS Part 2 data not found</div>';

  return `
    <div class="gmdss-part2-container">
      <!-- Floating Particles -->
      <div class="floating-particle"></div>
      <div class="floating-particle"></div>
      <div class="floating-particle"></div>
      <div class="floating-particle"></div>
      <div class="floating-particle"></div>
      
      <!-- Progress Bar -->
      <div class="progress-bar"></div>
      

      
      <div class="gmdss-sections">
        ${gmdssData.sections.map((section, sectionIndex) => {
          if (section.flashcards) {
            return renderFlashcardsSection(section, sectionIndex);
          } else if (section.scenarios) {
            return renderScenariosSection(section, sectionIndex);
          } else if (section.challenges) {
            return renderChallengesSection(section, sectionIndex);
          }
          return '';
        }).join('')}
      </div>
    </div>
  `;
}

function renderFlashcardsSection(section, sectionIndex) {
  return `
    <div class="flashcards-section" data-section="${sectionIndex}">
      <h2>${section.label}</h2>
      <p class="section-description">${section.description}</p>
      
      <div class="flashcards-container">
        ${section.flashcards.map((flashcard, index) => `
          <div class="flashcard" data-flashcard="${index}">
            <div class="flashcard-inner">
              <div class="flashcard-front">
                <div class="flashcard-question">
                  <h3>שאלה ${index + 1}</h3>
                  <p>${flashcard.question}</p>
                </div>
                <button class="flip-btn" onclick="flipFlashcard(${sectionIndex}, ${index})">
                  <span>הצג תשובה</span>
                </button>
              </div>
              <div class="flashcard-back">
                <div class="flashcard-answer">
                  <h3>תשובה</h3>
                  <p>${flashcard.answer}</p>
                </div>
                <button class="flip-btn" onclick="flipFlashcard(${sectionIndex}, ${index})">
                  <span>הצג שאלה</span>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderScenariosSection(section, sectionIndex) {
  return `
    <div class="scenarios-section" data-section="${sectionIndex}">
      <h2>${section.label}</h2>
      <p class="section-description">${section.description}</p>
      
      <div class="scenarios-container">
        ${section.scenarios.map((scenario, scenarioIndex) => `
          <div class="scenario" data-scenario="${scenarioIndex}">
            <div class="scenario-header">
              <h3>${scenario.title}</h3>
              <p class="scenario-description">${scenario.description}</p>
            </div>
            
            <div class="scenario-tasks">
              ${scenario.tasks.map((task, taskIndex) => `
                <div class="task" data-task="${taskIndex}">
                  <div class="task-question">
                    <h4>משימה ${taskIndex + 1}</h4>
                    <p>${task.question}</p>
                  </div>
                  
                  <div class="task-input">
                    <textarea 
                      class="task-answer-input" 
                      placeholder="הקלד את תשובתך כאן..."
                      data-scenario="${scenarioIndex}"
                      data-task="${taskIndex}"
                      oninput="validateScenarioAnswer(${scenarioIndex}, ${taskIndex}, this.value)"
                    ></textarea>
                  </div>
                  
                  <div class="task-feedback" id="feedback-${scenarioIndex}-${taskIndex}"></div>
                  
                  <button class="show-answer-btn" onclick="showScenarioAnswer(${scenarioIndex}, ${taskIndex})">
                    הצג תשובה נכונה
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderChallengesSection(section, sectionIndex) {
  return `
    <div class="challenges-section" data-section="${sectionIndex}">
      <h2>${section.label}</h2>
      <p class="section-description">${section.description}</p>
      
      <div class="challenges-container">
        ${section.challenges.map((challenge, index) => `
          <div class="challenge" data-challenge="${index}">
            <div class="challenge-question">
              <h3>אתגר ${index + 1}</h3>
              <p>${challenge.question}</p>
            </div>
            
            <div class="challenge-input">
              <textarea 
                class="challenge-answer-input" 
                placeholder="הקלד את תשובתך כאן..."
                data-challenge="${index}"
              ></textarea>
            </div>
            
            <button class="show-answer-btn" onclick="showChallengeAnswer(${index})">
              הצג תשובה מפורטת
            </button>
            
            <div class="challenge-answer" id="challenge-answer-${index}" style="display: none;">
              <h4>תשובה מפורטת:</h4>
              <p>${challenge.answer}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Flashcard flip function
function flipFlashcard(sectionIndex, flashcardIndex) {
  const flashcard = document.querySelector(`[data-section="${sectionIndex}"] .flashcard[data-flashcard="${flashcardIndex}"]`);
  if (flashcard) {
    flashcard.classList.toggle('flipped');
  }
}

// Scenario validation function
function validateScenarioAnswer(scenarioIndex, taskIndex, userAnswer) {
  const gmdssData = window.gmdssPart2Data;
  const scenario = gmdssData.sections[1].scenarios[scenarioIndex];
  const task = scenario.tasks[taskIndex];
  
  const feedbackElement = document.getElementById(`feedback-${scenarioIndex}-${taskIndex}`);
  const userAnswerLower = userAnswer.toLowerCase();
  const keywords = task.keywords.map(keyword => keyword.toLowerCase());
  
  const matchedKeywords = keywords.filter(keyword => 
    userAnswerLower.includes(keyword)
  );
  
  if (matchedKeywords.length >= Math.ceil(keywords.length * 0.6)) {
    feedbackElement.innerHTML = '<div class="feedback-success">✓ תשובה טובה! כללת את רוב המילות המפתח הנדרשות.</div>';
    feedbackElement.className = 'task-feedback success';
  } else if (matchedKeywords.length > 0) {
    feedbackElement.innerHTML = '<div class="feedback-partial">⚠ תשובה חלקית. נסה לכלול יותר מילות מפתח.</div>';
    feedbackElement.className = 'task-feedback partial';
  } else {
    feedbackElement.innerHTML = '<div class="feedback-error">✗ תשובה לא מדויקת. בדוק את המילות המפתח הנדרשות.</div>';
    feedbackElement.className = 'task-feedback error';
  }
}

// Show scenario answer function
function showScenarioAnswer(scenarioIndex, taskIndex) {
  const gmdssData = window.gmdssPart2Data;
  const scenario = gmdssData.sections[1].scenarios[scenarioIndex];
  const task = scenario.tasks[taskIndex];
  
  const feedbackElement = document.getElementById(`feedback-${scenarioIndex}-${taskIndex}`);
  feedbackElement.innerHTML = `
    <div class="feedback-answer">
      <h4>תשובה נכונה:</h4>
      <p>${task.answer}</p>
    </div>
  `;
  feedbackElement.className = 'task-feedback answer';
}

// Show challenge answer function
function showChallengeAnswer(challengeIndex) {
  const gmdssData = window.gmdssPart2Data;
  const challenge = gmdssData.sections[2].challenges[challengeIndex];
  
  const answerElement = document.getElementById(`challenge-answer-${challengeIndex}`);
  answerElement.style.display = 'block';
}



// פונקציה ל-vibration וצליל שגיאה
function triggerErrorFeedback() {
  // בדוק אם הצליל/רטט מופעל
  if (!state.soundFeedback) {
    return;
  }
  
  // בדוק אם זה מובייל
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // במובייל - רטט וצליל
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // רטט קצר
    }
    
    // צליל שגיאה במובייל
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('לא ניתן לנגן צליל:', e);
    }
  } else {
    // ב-PC - רק צליל
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('לא ניתן לנגן צליל:', e);
    }
  }
}

// פונקציה לצליל הצלחה מגניב
function triggerSuccessFeedback() {
  // בדוק אם הצליל/רטט מופעל
  if (!state.soundFeedback) {
    return;
  }
  
  // בדוק אם זה מובייל
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // במובייל - רטט וצליל
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 100, 50, 200]); // רטט הצלחה
    }
  }
  
  // צליל הצלחה מגניב (עובד גם במובייל וגם ב-PC)
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // צליל עולה - הצלחה!
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('לא ניתן לנגן צליל:', e);
  }
}

// פונקציה לבדיקת מילה מילה כשהמשתמש מקיש רווח
function checkWordByWord(userInput, correctSentence) {
  // בדוק רק אם הטקסט מסתיים ברווח (המשתמש סיים מילה)
  if (!userInput.endsWith(' ')) {
    return;
  }
  
  const userWords = userInput.trim().split(/\s+/);
  const correctWords = correctSentence.trim().split(/\s+/);
  
  // בדוק רק את המילה האחרונה שהוקלדה
  if (userWords.length > 0) {
    const lastUserWord = userWords[userWords.length - 1].toUpperCase();
    const wordIndex = userWords.length - 1;
    
    if (wordIndex < correctWords.length) {
      const correctWord = correctWords[wordIndex].toUpperCase();
      
      // אם המילה האחרונה לא תואמת, הפעל צליל/רטט
      if (lastUserWord !== correctWord) {
        triggerErrorFeedback();
      }
    }
  }
}

// פונקציה למעבר אוטומטי ל-box הבא במובייל
function moveToNextInput(currentKey, currentIdx) {
  // בדוק אם זה מובייל
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile || state.tab !== 0) {
    return; // רק במובייל ובשאלות מצוקה
  }
  
  // מצא את הסעיף הנוכחי
  const currentQuestion = distressQuestions[state.distressQuestionIndex];
  const currentSection = currentQuestion.sections.find((s, i) => getSectionKey(currentQuestion.id, i) === currentKey);
  
  if (!currentSection) return;
  
  // מצא את ה-input הבא
  const nextIdx = currentIdx + 1;
  if (nextIdx < currentSection.sentences.length) {
    const nextInput = document.querySelector(`textarea[data-key="${currentKey}"][data-idx="${nextIdx}"]`);
    if (nextInput) {
      nextInput.focus();
      nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
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
      const oldAccuracy = accuracyElement.textContent.replace('%', '') || '0';
      const newAccuracy = val ? accuracy : 0;
      
      accuracyElement.textContent = val ? accuracy + '%' : '';
      accuracyElement.style.color = accuracy === 100 ? '#388e3c' : accuracy > 60 ? '#fbc02d' : '#d32f2f';
      
      // בדוק מילה מילה בשאלות מצוקה
      if (val && state.tab === 0) {
        checkWordByWord(val, sentence);
      }
      
      // הפעל צליל הצלחה אם הגיע ל-100%
      if (val && accuracy === 100 && state.tab === 0) {
        triggerSuccessFeedback();
      }
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
  
  // אם זה הטאב של המבחן האמריקאי (index 2), תמיד חזור למסך בחירת מספר שאלות
  if (i === 2) {
    state.americanExamQuestions = [];
    state.americanExamAnswers = {};
    state.americanExamIndex = 0;
    state.americanExamFinished = false;
  }
  
  // אם זה הטאב של השאלות האמריקאיות (index 2), עצור את הטיימר האוטומטי
  if (i === 2 && state.autoAdvance) {
    stopAutoAdvance();
  }
  
  saveUserPreferences(); // Save current tab
  renderWithoutFocus();
};

window.toggleMode = function () {
  state.mode = state.mode === 'basic' ? 'advanced' : 'basic';
  saveUserPreferences(); // Save mode preference
  render();
};

window.toggleTheme = function () {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', state.theme);
  saveUserPreferences(); // Save theme preference
  render();
};

window.toggleSoundFeedback = function () {
  state.soundFeedback = !state.soundFeedback;
  saveUserPreferences(); // Save sound feedback preference
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
  state.revealed[key] = Infinity;
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
  if (state.autoAdvance && state.tab === 2) {
    console.log('Starting auto advance timer for', state.autoAdvanceSeconds, 'seconds');
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
  saveUserPreferences(); // Save current American question
  render();
  
  // Stop auto advance timer when manually selecting a question
  if (state.autoAdvance) {
    stopAutoAdvance();
  }
};

window.previousAmericanQuestion = function () {
  console.log('Previous - Current index:', state.americanQuestionIndex);
  if (state.americanQuestionIndex > 0) {
    state.americanQuestionIndex--;
    console.log('Previous - New index:', state.americanQuestionIndex);
    saveUserPreferences(); // Save current American question
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
    saveUserPreferences(); // Save current American question
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
    saveUserPreferences(); // Save current American question
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
    saveUserPreferences(); // Save current American question
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
  saveUserPreferences(); // Save current distress question
  // Force reset audio for new question
  forceResetAudioForNewQuestion();
  render();
  

};

window.previousDistressQuestion = function () {
  console.log('Previous distress - Current index:', state.distressQuestionIndex);
  if (state.distressQuestionIndex > 0) {
    state.distressQuestionIndex--;
    console.log('Previous distress - New index:', state.distressQuestionIndex);
    saveUserPreferences(); // Save current distress question
    // Force reset audio for new question
    forceResetAudioForNewQuestion();
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
    saveUserPreferences(); // Save current distress question
    // Force reset audio for new question
    forceResetAudioForNewQuestion();
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
    saveUserPreferences(); // Save current distress question
    // Force reset audio for new question
    forceResetAudioForNewQuestion();
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
    saveUserPreferences(); // Save current distress question
    // Force reset audio for new question
    forceResetAudioForNewQuestion();
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
  saveUserPreferences(); // Save distress auto-advance settings
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
        // Force reset audio for new question
        forceResetAudioForNewQuestion();
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
  if (state.autoAdvance && state.tab === 2) {
    clearTimeout(autoAdvanceTimer);
    // Don't start timer immediately - wait for user to select an answer
  }
}

function startAutoAdvanceTimer() {
  if (state.autoAdvance && state.tab === 2) {
    console.log('Auto advance timer started for', state.autoAdvanceSeconds, 'seconds');
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      console.log('Auto advance timer fired, advancing to next question');
      if (state.americanQuestionIndex < americanQuestions.length - 1) {
        state.americanQuestionIndex++;
        saveUserPreferences(); // Save the new question index when auto-advancing
        render();
        // Don't restart timer automatically - wait for user to select answer
      }
    }, state.autoAdvanceSeconds * 1000);
  }
}

function stopAutoAdvance() {
  if (autoAdvanceTimer) {
    console.log('Stopping auto advance timer');
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
  saveUserPreferences(); // Save auto-advance settings
  render();
};

window.setAutoAdvanceSeconds = function (seconds) {
  console.log('Setting auto advance seconds to:', seconds);
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
  saveUserPreferences(); // Save auto-advance settings
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

// New render function for the American Exam (identical to renderAmericanTest, but with configurable number of random questions, no nav bars, and with a finish button)
function renderAmericanExam() {
  console.log('renderAmericanExam called, questions length:', state.americanExamQuestions.length, 'question count:', state.americanExamQuestionCount);
  // Show question count selection if no exam is in progress
  if (state.americanExamQuestions.length === 0 && !state.americanExamFinished) {
    return `<div class="content">
      <div class="american-exam-setup" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;">
        <div style="background:${state.theme === 'dark' ? '#23272e' : 'linear-gradient(120deg,#e3f2fd,#fffde7)'};padding:40px 32px 32px 32px;border-radius:24px;box-shadow:0 4px 32px #0002;display:flex;flex-direction:column;align-items:center;max-width:600px;width:100%;color:${state.theme === 'dark' ? '#e3eaf7' : '#222'};">
          <div style="font-size:3em;line-height:1;margin-bottom:12px;">📝</div>
          <div style="font-size:2em;font-weight:800;color:#1976d2;text-shadow:0 2px 8px #1976d233;margin-bottom:12px;letter-spacing:1px;">מבחן אמריקאי</div>
          <div style="font-size:1.2em;margin-bottom:24px;text-align:center;">בחר מספר שאלות למבחן</div>
          
          <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:24px;">
            <button data-question-count="10" class="exam-question-count-btn" style="padding:12px 20px;font-size:1.1em;background:#1976d2;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#125ea2'" onmouseout="this.style.background='#1976d2'">10 שאלות</button>
            <button data-question-count="15" class="exam-question-count-btn" style="padding:12px 20px;font-size:1.1em;background:#1976d2;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#125ea2'" onmouseout="this.style.background='#1976d2'">15 שאלות</button>
            <button data-question-count="20" class="exam-question-count-btn" style="padding:12px 20px;font-size:1.1em;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:all 0.2s;font-weight:bold;" onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4caf50'">20 שאלות (ברירת מחדל)</button>
            <button data-question-count="25" class="exam-question-count-btn" style="padding:12px 20px;font-size:1.1em;background:#1976d2;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#125ea2'" onmouseout="this.style.background='#1976d2'">25 שאלות</button>
            <button data-question-count="30" class="exam-question-count-btn" style="padding:12px 20px;font-size:1.1em;background:#1976d2;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#125ea2'" onmouseout="this.style.background='#1976d2'">30 שאלות</button>
            <button data-question-count="50" class="exam-question-count-btn" style="padding:12px 20px;font-size:1.1em;background:#1976d2;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#125ea2'" onmouseout="this.style.background='#1976d2'">50 שאלות</button>
          </div>
          
          <div style="font-size:0.9em;color:#888;text-align:center;max-width:400px;">
            המבחן יכלול שאלות אקראיות מתוך מאגר השאלות. 
            <br>20 שאלות הוא המספר הסטנדרטי למבחן אמיתי.
          </div>
          
          ${state.americanExamHistory.length > 0 ? `
            <div style="margin-top:32px;width:100%;max-width:600px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="font-size:1.3em;font-weight:600;text-align:center;color:${state.theme === 'dark' ? '#e3eaf7' : '#222'};margin:0;">היסטוריית מבחנים</h3>
                <button onclick="clearExamHistory()" style="padding:6px 12px;font-size:0.8em;background:#dc3545;color:#fff;border:none;border-radius:4px;cursor:pointer;" title="מחק היסטוריה">🗑️</button>
              </div>
              <div style="max-height:300px;overflow-y:auto;border-radius:12px;background:${state.theme === 'dark' ? '#2a2e35' : '#f8f9fa'};padding:16px;">
                ${state.americanExamHistory.slice(0, 10).map((exam, index) => {
                  const isDark = state.theme === 'dark';
                  const bgColor = isDark ? '#23272e' : '#fff';
                  const borderColor = isDark ? '#333a44' : '#e0e0e0';
                  const textColor = isDark ? '#e3eaf7' : '#222';
                  const scoreColor = exam.score >= 80 ? '#388e3c' : exam.score >= 60 ? '#fbc02d' : '#d32f2f';
                  
                  return `
                    <div style="margin-bottom:12px;padding:12px;background:${bgColor};border-radius:8px;border:1px solid ${borderColor};color:${textColor};">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-weight:600;font-size:1.1em;">מבחן ${index + 1}</span>
                        <span style="font-weight:bold;color:${scoreColor};font-size:1.2em;">${exam.score}%</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;font-size:0.9em;color:#888;">
                        <span>${exam.questionCount} שאלות</span>
                        <span>${exam.correctAnswers}/${exam.totalQuestions} נכונות</span>
                      </div>
                      <div style="font-size:0.8em;color:#888;margin-top:4px;">${exam.date}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>`;
  }
  
  // Initialize random questions if not already
  if (state.americanExamQuestions.length !== state.americanExamQuestionCount) {
    console.log('Generating questions:', state.americanExamQuestionCount);
    state.americanExamQuestions = getRandomQuestions(americanQuestions, state.americanExamQuestionCount);
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
    const answered = Object.keys(state.americanExamAnswers).length;
    const unanswered = state.americanExamQuestionCount - answered;
    const score = Math.round((correct / state.americanExamQuestionCount) * 100);
    // Select icon by score
    let finishIcon = '🏆';
    if (score >= 96) finishIcon = '🏆';
    else if (score >= 80) finishIcon = '😃';
    else if (score >= 60) finishIcon = '🙂';
    else finishIcon = '😢';
    // Confetti only for 96+
    setTimeout(() => { if (score >= 96 && typeof createConfetti === 'function') createConfetti(); }, 100);
    
    // Save exam to history
    saveExamToHistory();
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
        ${!userAns ? `<div style='font-size:0.9em;color:#dc3545;margin-bottom:8px;'>⚠️ לא ענית על שאלה זו</div>` : ''}
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
        ${q.explanation ? `
          <div style='margin-top:12px;display:flex;justify-content:center;'>
            <button 
              onclick="showExplanationFromData(this)" 
              data-explanation="${q.explanation.replace(/"/g, '&quot;')}"
              style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;border-radius:8px;padding:8px 16px;font-size:0.9rem;font-weight:500;cursor:pointer;transition:all 0.3s ease;box-shadow:0 2px 8px rgba(102, 126, 234, 0.3);white-space:nowrap;display:flex;align-items:center;gap:6px;"
              onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'"
              onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.3)'"
              title="הסבר מפורט"
            >
              📖 הסבר מפורט
            </button>
          </div>
        ` : ''}
      </div>`;
    }).join('');
    return `<div class="content">
      <div class="american-exam-finish" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;">
        <div style="background:${isDark ? '#23272e' : 'linear-gradient(120deg,#e3f2fd,#fffde7)'};padding:40px 32px 32px 32px;border-radius:24px;box-shadow:0 4px 32px #0002;display:flex;flex-direction:column;align-items:center;max-width:600px;width:100%;color:${reviewText};">
          <div style="font-size:3em;line-height:1;margin-bottom:12px;">${finishIcon}</div>
          <div style="font-size:2em;font-weight:800;color:#1976d2;text-shadow:0 2px 8px #1976d233;margin-bottom:12px;letter-spacing:1px;">סיימת את המבחן!</div>
          <div class="score" style="font-size:2.2em;font-weight:800;color:#388e3c;background:${correctBg};padding:16px 38px 10px 38px;border-radius:16px;box-shadow:0 2px 8px #388e3c22;margin-bottom:8px;letter-spacing:1px;">${score}</div>
          <div style="font-size:1em;color:#888;margin-bottom:18px;">נכונות: ${correct} / ${state.americanExamQuestionCount}</div>
          ${unanswered > 0 ? `<div style="font-size:0.9em;color:#dc3545;margin-bottom:18px;">⚠️ ${unanswered} שאלות לא נענו</div>` : ''}
          <div class="exam-review-container" style="width:100%;margin:24px 0 12px 0;max-height:50vh;overflow-y:auto;direction:rtl;text-align:right;">${reviewHtml}</div>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button onclick="restartAmericanExam()" class="restart-btn" style="padding:10px 28px;font-size:1.1em;background:#1976d2;color:#fff;border:none;border-radius:8px;box-shadow:0 2px 8px #1976d233;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#125ea2'" onmouseout="this.style.background='#1976d2'">נסה שוב</button>
            <button onclick="returnToSelection()" style="padding:10px 28px;font-size:1.1em;background:#6c757d;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">חזור לבחירה</button>
          </div>
        </div>
      </div>
      ${state.showExplanation ? `
        <div class="explanation-modal-overlay" onclick="hideExplanation()">
          <div class="explanation-modal" onclick="event.stopPropagation()">
            <div class="explanation-header">
              <h3>הסבר מפורט</h3>
              <button class="explanation-close-btn" onclick="hideExplanation()">✕</button>
            </div>
            <div class="explanation-content">
              ${state.currentExplanation}
            </div>
          </div>
        </div>
      ` : ''}
    </div>`;
  }
  // Improved progress indicator
  const progress = ((idx + 1) / state.americanExamQuestionCount) * 100;
  return `<div class="content">
    <div class="american-exam-container">
      <div class="exam-progress-bar-container" style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div class="exam-progress-label" style="font-size:1.1em;font-weight:500;direction:rtl;">שאלה <span style='color:#1976d2;font-weight:bold;'>${idx + 1}</span> מתוך <span style='color:#1976d2;font-weight:bold;'>${state.americanExamQuestionCount}</span></div>
        <div class="exam-progress-bar-outer" style="flex:1;height:14px;background:#e0e0e0;border-radius:7px;overflow:hidden;box-shadow:0 1px 4px #0001;">
          <div class="exam-progress-bar-inner" style="height:100%;width:${progress}%;background:linear-gradient(90deg,#1976d2,#42a5f5);transition:width 0.3s;"></div>
        </div>
      </div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;">
        <button onclick="previousQuestion()" ${idx === 0 ? 'disabled' : ''} style="padding:12px 20px;font-size:1em;background:${idx === 0 ? '#e9ecef' : '#007bff'};color:${idx === 0 ? '#6c757d' : '#fff'};border:2px solid ${idx === 0 ? '#dee2e6' : '#007bff'};border-radius:8px;cursor:${idx === 0 ? 'not-allowed' : 'pointer'};transition:all 0.3s ease;font-weight:600;min-width:120px;justify-content:center;" onmouseover="this.style.background='${idx === 0 ? '#e9ecef' : '#0056b3'}'" onmouseout="this.style.background='${idx === 0 ? '#e9ecef' : '#007bff'}'" title="שאלה קודמת">
          קודמת
        </button>
        <button onclick="nextQuestion()" ${idx === questions.length - 1 ? 'disabled' : ''} style="padding:12px 20px;font-size:1em;background:${idx === questions.length - 1 ? '#e9ecef' : '#007bff'};color:${idx === questions.length - 1 ? '#6c757d' : '#fff'};border:2px solid ${idx === questions.length - 1 ? '#dee2e6' : '#007bff'};border-radius:8px;cursor:${idx === questions.length - 1 ? 'not-allowed' : 'pointer'};transition:all 0.3s ease;font-weight:600;min-width:120px;justify-content:center;" onmouseover="this.style.background='${idx === questions.length - 1 ? '#e9ecef' : '#0056b3'}'" onmouseout="this.style.background='${idx === questions.length - 1 ? '#e9ecef' : '#007bff'}'" title="שאלה הבאה">
          הבאה
        </button>
      </div>
      
      <div class="american-question">
        <h3 class="question-text">${current.question}</h3>
        <div class="options-container">
          ${current.options.map(option => {
            const isSelected = state.americanExamAnswers[current.id] === option.id;
            const isCorrect = option.correct;
            const showResult = state.americanExamAnswers[current.id] !== undefined;
            let optionClass = 'option-button';
            if (isSelected) {
              optionClass += ' selected';
            }
            return `
              <button 
                class="${optionClass}"
                onclick="selectAmericanExamAnswer('${current.id}', '${option.id}')"
              >
                <span class="option-letter">${option.id.toUpperCase()}</span>
                <span class="option-text">${option.text}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
      
      ${idx === questions.length - 1 ? `
        <div style="display:flex;justify-content:center;margin-top:24px;">
          <button onclick="finishExam()" style="padding:12px 24px;font-size:1.1em;background:#28a745;color:#fff;border:none;border-radius:8px;cursor:pointer;transition:background 0.2s;font-weight:bold;" onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
            ✅ סיים מבחן
          </button>
        </div>
      ` : ''}

    </div>
  </div>`;
}

window.selectAmericanExamQuestion = function (index) {
  state.americanExamIndex = index;
  render();
};
window.previousQuestion = function () {
  if (state.americanExamIndex > 0) {
    state.americanExamIndex--;
    render();
  }
};

window.nextQuestion = function () {
  if (state.americanExamIndex < state.americanExamQuestions.length - 1) {
    state.americanExamIndex++;
    render();
  }
};

window.goToQuestion = function (index) {
  state.americanExamIndex = index;
  render();
};

window.finishExam = function () {
  state.americanExamFinished = true;
  render();
};

window.selectAmericanExamAnswer = function (qid, oid) {
  state.americanExamAnswers[qid] = oid;
  // Auto-advance to next question only (not on last question)
  if (state.americanExamIndex < state.americanExamQuestionCount - 1) {
    state.americanExamIndex++;
  }
  // Don't auto-finish on last question - user must click "סיים מבחן"
  render();
};
window.finishAmericanExam = function () {
  state.americanExamFinished = true;
  render();
};
function saveExamToHistory() {
  const questions = state.americanExamQuestions;
  const correct = questions.filter(q => {
    const ans = state.americanExamAnswers[q.id];
    return q.options.find(o => o.id === ans && o.correct);
  }).length;
  const score = Math.round((correct / state.americanExamQuestionCount) * 100);
  
  const examRecord = {
    id: Date.now(),
    date: new Date().toLocaleString('he-IL'),
    questionCount: state.americanExamQuestionCount,
    correctAnswers: correct,
    totalQuestions: state.americanExamQuestionCount,
    score: score,
    answers: { ...state.americanExamAnswers }
  };
  
  state.americanExamHistory.unshift(examRecord); // Add to beginning of array
  console.log('Saved exam to history:', examRecord);
  
  // Save to localStorage
  saveUserPreferences();
}

function setExamQuestionCount(count) {
  console.log('setExamQuestionCount called with:', count);
  console.log('americanQuestions available:', americanQuestions ? americanQuestions.length : 'undefined');
  state.americanExamQuestionCount = count;
  state.americanExamQuestions = [];
  state.americanExamAnswers = {};
  state.americanExamIndex = 0;
  state.americanExamFinished = false;
  
  // Immediately generate the questions
  state.americanExamQuestions = getRandomQuestions(americanQuestions, state.americanExamQuestionCount);
  console.log('Generated', state.americanExamQuestions.length, 'questions');
  
  render();
}

window.setExamQuestionCount = setExamQuestionCount;

window.clearExamHistory = function () {
  if (confirm('האם אתה בטוח שברצונך למחוק את כל היסטוריית המבחנים?')) {
    state.americanExamHistory = [];
    saveUserPreferences();
    render();
    alert('היסטוריית המבחנים נמחקה בהצלחה!');
  }
};

window.restartAmericanExam = function () {
  // Keep the same question count but generate new random questions
  state.americanExamQuestions = getRandomQuestions(americanQuestions, state.americanExamQuestionCount);
  state.americanExamAnswers = {};
  state.americanExamIndex = 0;
  state.americanExamFinished = false;
  render();
};

window.finishExamEarly = function () {
  if (confirm('האם אתה בטוח שברצונך לסיים את המבחן עכשיו? שאלות שלא ענית עליהן ייחשבו כטעויות.')) {
    state.americanExamFinished = true;
    render();
  }
};

window.returnToSelection = function () {
  // Clear everything and return to selection screen
  state.americanExamQuestions = [];
  state.americanExamAnswers = {};
  state.americanExamIndex = 0;
  state.americanExamFinished = false;
  render();
};

window.toggleSectionMode = function (key) {
  state.sectionModes[key] = state.sectionModes[key] === 'advanced' ? 'basic' : 'advanced';
  saveUserPreferences(); // Save section mode preference
  render();
};

// פונקציות להצגת הסבר מפורט
window.showExplanation = function (explanation) {
  console.log('showExplanation called with:', explanation);
  state.showExplanation = true;
  state.currentExplanation = explanation;
  render();
};

window.showExplanationFromData = function (button) {
  const explanation = button.getAttribute('data-explanation');
  console.log('showExplanationFromData called with:', explanation);
  console.log('Button element:', button);
  
  // Save current scroll position of the inner container
  const scrollContainer = document.querySelector('.exam-review-container');
  if (scrollContainer) {
    state.savedScrollPosition = scrollContainer.scrollTop;
    localStorage.setItem('gmdss_saved_scroll_position', scrollContainer.scrollTop.toString());
    console.log('Saved scroll position:', scrollContainer.scrollTop);
  } else {
    console.log('Scroll container not found');
  }
  
  state.showExplanation = true;
  state.currentExplanation = explanation;
  render();
};

window.hideExplanation = function () {
  console.log('hideExplanation called');
  state.showExplanation = false;
  state.currentExplanation = '';
  render();
  
  // Restore scroll position after DOM update
  requestAnimationFrame(() => {
    const savedPosition = state.savedScrollPosition || localStorage.getItem('gmdss_saved_scroll_position');
    console.log('Restoring scroll position:', savedPosition);
    if (savedPosition !== undefined && savedPosition !== null) {
      const scrollContainer = document.querySelector('.exam-review-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = parseInt(savedPosition);
        console.log('Restored scroll position to:', parseInt(savedPosition));
      } else {
        console.log('Scroll container not found for restoration');
      }
    }
  });
};


// Load user preferences at startup
loadUserPreferences();

render();

// Apply theme as default (will be overridden by preferences if saved)
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
    
    // Handle exam question count button clicks
    if (e.target.classList.contains('exam-question-count-btn')) {
      const questionCount = parseInt(e.target.getAttribute('data-question-count'));
      console.log('Exam question count button clicked:', questionCount);
      setExamQuestionCount(questionCount);
    }
  });
  
  // Add event listener for Enter key in mobile
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('input-sentence')) {
      // בדוק אם זה מובייל
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile && state.tab === 0) {
        e.preventDefault(); // מניע יצירת שורה חדשה
        
        // מצא את המפתח והאינדקס של ה-input הנוכחי
        const key = e.target.getAttribute('data-key');
        const idx = parseInt(e.target.getAttribute('data-idx'));
        
        // עבור ל-input הבא
        moveToNextInput(key, idx);
      }
    }
  });
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+R to clear preferences
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      if (confirm('האם אתה בטוח שברצונך לאפס את כל ההעדפות?')) {
        clearUserPreferences();
        render();
        alert('ההעדפות אופסו בהצלחה!');
      }
    }
    
    // Ctrl+Shift+P to show preferences
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      showUserPreferences();
    }
  }); 

// Handle mobile keyboard visibility for sticky elements
function handleMobileKeyboard() {
  let initialViewportHeight = window.innerHeight;
  let keyboardVisible = false;
  
  // Function to check if keyboard is visible
  function checkKeyboardVisibility() {
    const currentViewportHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentViewportHeight;
    
    // If viewport height decreased significantly, keyboard is likely visible
    if (heightDifference > 150) {
      if (!keyboardVisible) {
        keyboardVisible = true;
        const stickyElements = document.querySelectorAll('.question-description.sticky');
        stickyElements.forEach(element => {
          element.classList.add('keyboard-active');
        });
      }
    } else {
      if (keyboardVisible) {
        keyboardVisible = false;
        const stickyElements = document.querySelectorAll('.question-description.sticky');
        stickyElements.forEach(element => {
          element.classList.remove('keyboard-active');
        });
      }
    }
  }
  
  // Listen for viewport changes
  window.addEventListener('resize', checkKeyboardVisibility);
  
  // Also check on focus events (when user taps input fields)
  document.addEventListener('focusin', function(e) {
    if (e.target.classList.contains('input-sentence')) {
      setTimeout(checkKeyboardVisibility, 300); // Delay to allow keyboard to appear
    }
  });
  
  document.addEventListener('focusout', function(e) {
    if (e.target.classList.contains('input-sentence')) {
      setTimeout(checkKeyboardVisibility, 300); // Delay to allow keyboard to disappear
    }
  });
}

// Audio Player - Using HTML5 native audio element

// Load audio player state from localStorage
function loadAudioPlayerState() {
  try {
    const savedState = localStorage.getItem('audioPlayerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      audioPlayerState = { ...audioPlayerState, ...parsedState };
    }
  } catch (e) {
    console.log('Could not load audio player state:', e);
  }
}

// Save audio player state before render
function saveAudioPlayerState() {
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    audioPlayerState.currentTime = audioElement.currentTime;
    audioPlayerState.isPlaying = !audioElement.paused;
    audioPlayerState.volume = audioElement.volume;
    audioPlayerState.muted = audioElement.muted;
    audioPlayerState.currentQuestion = state.distressQuestionIndex;
    
    // Save to localStorage
    localStorage.setItem('audioPlayerState', JSON.stringify(audioPlayerState));
  }
}

// Reset audio player completely
function resetAudioPlayer() {
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.load(); // Force reload
  }
  audioPlayerState.currentTime = 0;
  audioPlayerState.isPlaying = false;
  
  // Clear the saved state from localStorage
  localStorage.removeItem('audioPlayerState');
}

// Force reset audio player for new question
function forceResetAudioForNewQuestion() {
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    // Multiple resets to ensure it works
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.load();
    
    // Additional reset after a short delay
    setTimeout(() => {
      if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.pause();
      }
    }, 50);
    
    // One more reset after the element is fully loaded
    setTimeout(() => {
      if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.pause();
      }
    }, 200);
  }
}



// Restore audio player state after render
function restoreAudioPlayerState() {
  const audioElement = document.getElementById('audio-player');
  if (audioElement) {
    // Check if we're on a new question
    if (audioPlayerState.currentQuestion !== state.distressQuestionIndex) {
      // Reset for new question - pause and reset to beginning
      resetAudioPlayer();
      audioPlayerState.currentQuestion = state.distressQuestionIndex;
      
      // Force reset multiple times to ensure it starts from 0
      forceResetAudioForNewQuestion();
    } else {
      // Restore state for same question
      audioElement.currentTime = audioPlayerState.currentTime;
      audioElement.volume = audioPlayerState.volume;
      audioElement.muted = audioPlayerState.muted;
    }
  }
}

// Initialize the app
loadAudioPlayerState();
render();
loadUserPreferences();

