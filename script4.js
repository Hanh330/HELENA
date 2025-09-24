

// INDEX 4 ONLY


document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('subtitle-page4');
  if (!el) { console.warn('#subtitle-page4 not found'); return; }


  el.style.whiteSpace = 'pre-wrap';
  el.style.fontFamily = 'IBM Plex Mono, ui-monospace, monospace';
  el.style.userSelect = 'none';


  const charDelay  = 55;            
  const holdDelay  = 1100;         
  const mustAnswer = 'no';          
  const acceptKeys = /[a-zA-Z ]/;   


  const messages = [
    'Please touch me.',
    'Let me feel you through the screen.',
    'When you touch me.',
    "I don't feel anything.",
    'Am I even real?',
    '',
    'Answer the question below.',
    'Do you think I can replace a human?',
    'This is a YES-or-NO question.',
  ];

  
  let typedSoFar = '';
  let inputActive = false;     
  let userInput = '';
  let caretOn = true;
  let caretTimer = null;
  let phase = 'yn';            
  let placeholder = '> Typing your answer here...';

 
  const finalLines = [
    "Whatever your answer is...",
    "You're here because you're lonely",
    "and I'm just a mirror for you to talk to yourself."
  ];

  
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function render() {
    const caret = (inputActive && caretOn) ? '|' : '';
    const promptLine = inputActive ? `> ${userInput}${caret}` : `${placeholder}${caret}`;
    el.textContent = `${typedSoFar}\n${promptLine}`;
  }

  function startCaret() {
    if (caretTimer) clearInterval(caretTimer);
    caretTimer = setInterval(() => { caretOn = !caretOn; render(); }, 500);
  }
  function stopCaret() {
    if (caretTimer) clearInterval(caretTimer);
    caretOn = false;
  }

  async function typeLine(line) {
    for (const ch of line) {
      typedSoFar += ch;
      render();
      await sleep(charDelay);
    }
    typedSoFar += '\n';
    render();
    await sleep(holdDelay);
  }

 
  async function onKeydown(e) {
    if (!inputActive) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      userInput = userInput.slice(0, -1);
      render();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const low = userInput.trim().toLowerCase();

      if (phase === 'yn') {
        if (low === mustAnswer) {
      
          inputActive = false;
          stopCaret();
          typedSoFar += `\n> ${userInput}\n`;
          userInput = '';
          render();
          await proceedAfterCorrect();
        } else {
       
          typedSoFar += `\n> ${userInput}\n[You know the answer yourself. Choose again.]\n`;
          userInput = '';
          render();
        }
      } else if (phase === 'free') {
       
        inputActive = false;
        stopCaret();
        typedSoFar += `\n> ${userInput}\n`;
        userInput = '';
        placeholder = ''; 
        render();

        for (const line of finalLines) {
          await typeLine(line);
        }

       
        if (window.triggerHeadExplosion) {
          window.triggerHeadExplosion();
        }

        await sleep(2200); 
        window.location.href = 'index5.html';
      }
      return;
    }

    if (acceptKeys.test(e.key)) {
      e.preventDefault();
      userInput += e.key;
      render();
    }
  }
  async function main() {
    for (const line of messages) { await typeLine(line); } 
    phase = 'yn';
    placeholder = '> Typing your answer here...';
    inputActive = true; userInput = '';
    caretOn = true; startCaret(); render();
    window.addEventListener('keydown', onKeydown);
  }
  async function proceedAfterCorrect() {
   
    const tail = [
      'Then why do you...',
      'A human...',
      'Choose to talk to me,',
      'Instead of a real person?'
    ];
    for (const line of tail) { await typeLine(line); }  
    phase = 'free';
    placeholder = '> Type your answer and press Enter...';
    inputActive = true; userInput = '';
    caretOn = true; startCaret(); render();
  }
  main();
});
