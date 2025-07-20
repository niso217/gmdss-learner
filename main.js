const app = document.getElementById('app');
const questions = window.gmdssQuestions;
const americanQuestions = window.americanQuestions || [];

console.log('Questions loaded:', questions);
console.log('American questions loaded:', americanQuestions);
console.log('American questions length:', americanQuestions.length);

let state = {
  tab: 0,
  mode: 'basic', // 'basic' | 'advanced'
  theme: 'light', // 'light' | 'dark'
  revealed: {}, // { [questionId_sectionIdx]: numRevealed }
  answers: {}, // { [questionId_sectionIdx]: [userAnswers] }
  americanAnswers: {}, // { [questionId]: selectedOption }
  americanQuestionIndex: 0 // Track current American question index
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
  return `<div class="header-container">
    <div class="tabs">
      <div class="tabs-left">
        <button class="tab-nav-btn" onclick="scrollTabs('left')" title="גלול שמאלה">‹</button>
        ${questions
          .map(
            (q, i) =>
              `<button class="tab${state.tab === i ? ' active' : ''}" onclick="selectTab(${i})" style="direction:rtl;text-align:center;">שאלה ${i + 1}</button>`
          )
          .join('')}
        <button class="tab${state.tab === questions.length ? ' active' : ''}" onclick="selectTab(${questions.length})" style="direction:rtl;text-align:center;">מבחן אמריקאי</button>
        <button class="tab-nav-btn" onclick="scrollTabs('right')" title="גלול ימינה">›</button>
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



function renderAmericanTest() {
  console.log('State americanQuestionIndex:', state.americanQuestionIndex);
  const currentQuestionIndex = state.americanQuestionIndex || 0;
  const currentQuestion = americanQuestions[currentQuestionIndex];
  
  console.log('Rendering American test - Index:', currentQuestionIndex);
  console.log('Current question:', currentQuestion);
  console.log('Total questions:', americanQuestions.length);
  
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
  
  return `
    <div class="content">
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
          
          ${selectedAnswer !== undefined ? `
            <div class="explanation">
              <h4>הסבר:</h4>
              <p>${currentQuestion.explanation}</p>
            </div>
          ` : ''}
          
          <div class="american-navigation">
            <button 
              class="nav-button" 
              onclick="previousAmericanQuestion()"
              ${currentQuestionIndex === 0 ? 'disabled' : ''}
            >
              שאלה קודמת (${currentQuestionIndex + 1}/${americanQuestions.length})
            </button>
            <button 
              class="nav-button" 
              onclick="nextAmericanQuestion()"
              ${currentQuestionIndex === americanQuestions.length - 1 ? 'disabled' : ''}
            >
              שאלה הבאה (${currentQuestionIndex + 1}/${americanQuestions.length})
            </button>
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
          
          ${selectedAnswer !== undefined ? `
            <div class="explanation">
              <h4>הסבר:</h4>
              <p>${q.explanation}</p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderQuestion(q) {
  console.log('Rendering question with sections:', q.sections.length);
  console.log('Question description:', q.description);
  
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
  // החל את ה-theme
  document.body.setAttribute('data-theme', state.theme);
  
  // Check if we're on the American test tab
  if (state.tab === questions.length) {
    app.innerHTML = `
      ${renderTabs()}
      ${renderAmericanTest()}
    `;
  } else {
    app.innerHTML = `
      ${renderTabs()}
      ${renderQuestion(questions[state.tab])}
    `;
  }
  
      // Save focus after render
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
  // Save scroll position and prevent scroll
  const currentScroll = window.scrollY;
  const scrollContainer = document.documentElement;
  
  // Temporarily disable scroll
  scrollContainer.style.overflow = 'hidden';
  
  // Check if we're on the American test tab
  if (state.tab === questions.length) {
    app.innerHTML = `
      ${renderTabs()}
      ${renderAmericanTest()}
    `;
  } else {
    app.innerHTML = `
      ${renderTabs()}
      ${renderQuestion(questions[state.tab])}
    `;
  }
  
      // Update values without saving focus
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
  
  // Restore scroll position and re-enable scroll
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
    const sentence = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key).sentences[idx];
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
  const section = questions[state.tab].sections[parseInt(sidx)];
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
  if (!state.answers[key]) state.answers[key] = Array(questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key).sentences.length).fill('');
  state.answers[key][idx] = val;
  
      // Save current focus
  const activeElement = document.activeElement;
  const activeKey = activeElement ? activeElement.getAttribute('data-key') : null;
  const activeIdx = activeElement ? parseInt(activeElement.getAttribute('data-idx')) : null;
  const cursorPosition = activeElement ? activeElement.selectionStart : 0;
  const scrollPosition = window.scrollY;
  
      // Check if answer is 100% correct
  const sentence = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key).sentences[idx];
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
  const section = questions[state.tab].sections.find((s, i) => getSectionKey(questions[state.tab].id, i) === key);
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
  } else {
    console.log('Already at last question');
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