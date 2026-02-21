// Quiz modal - handles questions with attempts and scoring
export class QuizModal {
  /**
   * @param {HTMLElement} container
   * @param {object} questionData  { title, question, options[], answer, explanation }
   * @param {function} onComplete  callback(pointsEarned)
   */
  constructor(container, questionData, onComplete) {
    this.container = container;
    this.q = questionData;
    this.onComplete = onComplete;
    this.attempts = 0;
    this.maxAttempts = 3;
    this.answered = false;
    this._render();
  }

  _pointsForAttempt(attempt) {
    if (attempt === 1) return 100;
    if (attempt === 2) return 50;
    return 25;
  }

  _render() {
    const q = this.q;
    this.container.innerHTML = `
      <div class="quiz-backdrop">
        <div class="quiz-modal">
          <h3>${q.title}</h3>
          <p class="quiz-attempts" id="quiz-attempts">Percobaan: ${this.attempts}/${this.maxAttempts}</p>
          <p class="question">${q.question}</p>
          <div class="quiz-options" id="quiz-options">
            ${q.options.map((opt, i) => `
              <button class="quiz-option" data-index="${i}">${opt}</button>
            `).join('')}
          </div>
          <div class="quiz-feedback" id="quiz-feedback" style="display:none"></div>
          <button class="quiz-next-btn" id="quiz-next-btn" style="display:none">Lanjutkan ➜</button>
        </div>
      </div>
    `;

    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => this._handleAnswer(parseInt(btn.dataset.index)));
    });

    document.getElementById('quiz-next-btn').addEventListener('click', () => this._complete());
  }

  _handleAnswer(selectedIndex) {
    if (this.answered) return;
    this.attempts++;

    const attemptsEl = document.getElementById('quiz-attempts');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');
    const options = document.querySelectorAll('.quiz-option');

    const isCorrect = selectedIndex === this.q.answer;

    options[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      this.answered = true;
      const pts = this._pointsForAttempt(this.attempts);
      feedbackEl.className = 'quiz-feedback correct';
      feedbackEl.style.display = 'block';
      feedbackEl.innerHTML = `✅ Benar! +${pts} poin<br><small>${this.q.explanation}</small>`;
      nextBtn.style.display = 'block';
      nextBtn.textContent = 'Lanjutkan ➜';
      // disable all options
      options.forEach(o => o.disabled = true);
      options[this.q.answer].classList.add('correct');
      this._earnedPoints = pts;
    } else {
      feedbackEl.className = 'quiz-feedback wrong';
      feedbackEl.style.display = 'block';

      if (this.attempts >= this.maxAttempts) {
        this.answered = true;
        feedbackEl.innerHTML = `❌ Jawaban salah. Jawaban benar: ${this.q.options[this.q.answer]}<br><small>${this.q.explanation}</small>`;
        options.forEach(o => o.disabled = true);
        options[this.q.answer].classList.add('correct');
        nextBtn.style.display = 'block';
        nextBtn.textContent = 'Lanjutkan ➜';
        this._earnedPoints = 25;
      } else {
        feedbackEl.innerHTML = `❌ Kurang tepat. Coba lagi! (${this.maxAttempts - this.attempts} percobaan tersisa)`;
        setTimeout(() => {
          options[selectedIndex].classList.remove('wrong');
          feedbackEl.style.display = 'none';
        }, 1200);
      }
    }

    if (attemptsEl) attemptsEl.textContent = `Percobaan: ${this.attempts}/${this.maxAttempts}`;
  }

  _complete() {
    if (this.onComplete) this.onComplete(this._earnedPoints || 0);
    this.container.innerHTML = '';
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
