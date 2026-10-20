const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  stars: Number(localStorage.getItem('duvika_stars') || 0),
  completed: JSON.parse(localStorage.getItem('duvika_completed') || '[]'),
  mission: 'garden',
  index: 0,
  score: 0,
  answered: false
};

const missions = {
  garden: {
    title: 'Tantangan Kebun Perkalian!',
    label: 'MISI 01 · KEBUN',
    icon: '🍎',
    reward: 100,
    questions: [
      { q: 'Berapakah 2 × 3?', a: 6, choices: [5, 6, 8, 9] },
      { q: 'Paman Sam punya 4 keranjang. Tiap keranjang berisi 2 apel. Berapa apel semuanya?', a: 8, choices: [6, 8, 10, 12] },
      { q: 'Berapakah 5 × 3?', a: 15, choices: [10, 12, 15, 20] },
      { q: 'Ada 4 baris pohon, setiap baris 4 pohon. Berapa jumlah pohon?', a: 16, choices: [8, 12, 16, 20] },
      { q: 'Berapakah 3 × 5?', a: 15, choices: [8, 12, 15, 18] }
    ]
  },
  market: {
    title: 'Tantangan Pasar Perkalian!',
    label: 'MISI 02 · PASAR',
    icon: '🛍️',
    reward: 150,
    questions: [
      { q: 'Satu kantong berisi 3 jeruk. Berapa jeruk dalam 4 kantong?', a: 12, choices: [7, 10, 12, 16] },
      { q: 'Harga satu roti 2 ribu rupiah. Berapa harga 5 roti?', a: 10, choices: [7, 10, 12, 15] },
      { q: 'Ada 3 rak, setiap rak berisi 5 telur. Berapa telur semuanya?', a: 15, choices: [8, 12, 15, 20] },
      { q: 'Berapakah 4 × 5?', a: 20, choices: [15, 18, 20, 25] },
      { q: 'Ibu membeli 5 bungkus wortel, tiap bungkus 2 wortel. Berapa wortel?', a: 10, choices: [7, 10, 12, 15] }
    ]
  }
};

function saveProgress() {
  localStorage.setItem('duvika_stars', String(state.stars));
  localStorage.setItem('duvika_completed', JSON.stringify(state.completed));
  updateProgressUI();
}
function updateProgressUI() {
  if ($('#totalStars')) $('#totalStars').textContent = state.stars;
  if ($('#completedCount')) $('#completedCount').textContent = `${state.completed.length}/2`;
  const unlocked = state.completed.includes('garden');
  $('#marketLock').classList.toggle('unlocked', unlocked);
  $('#marketHint').textContent = unlocked ? 'Pilih kartu untuk berlatih ↗' : '🔒 Selesaikan Kebun terlebih dahulu';
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2700);
}
function openMission(missionId) {
  if (missionId === 'market' && !state.completed.includes('garden')) {
    showToast('Selesaikan Kebun Perkalian terlebih dahulu untuk membuka Pasar Perkalian! 🔒');
    return;
  }
  state.mission = missionId;
  state.index = 0;
  state.score = 0;
  state.answered = false;
  $('#quizModal').classList.add('open');
  $('#quizModal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderQuestion();
}
function closeQuiz() {
  $('#quizModal').classList.remove('open');
  $('#quizModal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function renderQuestion() {
  const mission = missions[state.mission];
  const item = mission.questions[state.index];
  state.answered = false;
  $('#quizArt').textContent = mission.icon;
  $('#quizMissionLabel').textContent = mission.label;
  $('#quizTitle').textContent = mission.title;
  $('#quizCount').textContent = `Pertanyaan ${state.index + 1} dari ${mission.questions.length}`;
  $('#questionProgress').style.width = `${(state.index / mission.questions.length) * 100}%`;
  $('#quizQuestion').textContent = item.q;
  $('#quizScore').textContent = state.score;
  $('#quizFeedback').textContent = 'Pilih jawaban yang menurutmu benar.';
  $('#quizFeedback').className = 'quiz-feedback';
  $('#nextQuestion').disabled = true;
  $('#nextQuestion').innerHTML = state.index === mission.questions.length - 1 ? 'Selesaikan Misi <span>✓</span>' : 'Lanjut <span>→</span>';
  const grid = $('#answerGrid');
  grid.innerHTML = '';
  [...item.choices].sort(() => Math.random() - 0.5).forEach(choice => {
    const button = document.createElement('button');
    button.className = 'answer-option';
    button.textContent = choice;
    button.addEventListener('click', () => chooseAnswer(button, choice, item.a));
    grid.appendChild(button);
  });
}
function chooseAnswer(button, choice, answer) {
  if (state.answered) return;
  state.answered = true;
  const buttons = $$('.answer-option');
  buttons.forEach(btn => {
    btn.disabled = true;
    if (Number(btn.textContent) === answer) btn.classList.add('correct');
  });
  if (choice === answer) {
    state.score += 1;
    button.classList.add('correct');
    $('#quizFeedback').textContent = 'Hebat! Jawabanmu benar. Kamu mendapat 1 bintang! ⭐';
    $('#quizFeedback').className = 'quiz-feedback good';
  } else {
    button.classList.add('wrong');
    $('#quizFeedback').textContent = `Belum tepat. Jawaban yang benar adalah ${answer}. Tetap semangat!`;
    $('#quizFeedback').className = 'quiz-feedback bad';
  }
  $('#quizScore').textContent = state.score;
  $('#questionProgress').style.width = `${((state.index + 1) / missions[state.mission].questions.length) * 100}%`;
  $('#nextQuestion').disabled = false;
  $('#nextQuestion').innerHTML = state.index === missions[state.mission].questions.length - 1 ? 'Lihat Hasil <span>🏆</span>' : 'Soal Berikutnya <span>→</span>';
}
function nextQuestion() {
  if (!state.answered) return;
  if (state.index < missions[state.mission].questions.length - 1) {
    state.index += 1;
    renderQuestion();
    return;
  }
  const missionId = state.mission;
  const mission = missions[missionId];
  const previousBest = state.completed.includes(missionId);
  const earned = state.score;
  if (!previousBest) {
    state.completed.push(missionId);
    state.stars += earned;
    saveProgress();
  }
  $('#quizArt').textContent = earned >= 4 ? '🏆' : '💪';
  $('#quizMissionLabel').textContent = 'HASIL PETUALANGAN';
  $('#quizTitle').textContent = earned >= 4 ? 'Misi Berhasil!' : 'Misi Selesai!';
  $('#quizCount').textContent = previousBest ? 'Kamu sudah pernah menyelesaikan misi ini.' : 'Progres belajarmu telah diperbarui.';
  $('#questionProgress').style.width = '100%';
  $('#quizQuestion').textContent = `${earned} dari 5 jawaban benar`;
  $('#answerGrid').innerHTML = `<div class="result-tile"><span>⭐</span><strong>${earned}</strong><small>Bintang didapat</small></div><div class="result-tile"><span>⚡</span><strong>+${mission.reward}</strong><small>XP petualangan</small></div>`;
  $('#answerGrid').style.gridTemplateColumns = '1fr 1fr';
  $('#quizFeedback').textContent = previousBest ? 'Misi ini sudah tercatat. Coba lagi untuk berlatih!' : (missionId === 'garden' ? 'Pasar Perkalian sekarang terbuka!' : 'Kamu makin jago perkalian!');
  $('#quizFeedback').className = 'quiz-feedback good';
  $('#nextQuestion').disabled = false;
  $('#nextQuestion').innerHTML = 'Kembali ke Peta <span>↗</span>';
  $('#nextQuestion').onclick = finishResult;
  showToast(previousBest ? 'Latihan selesai! Progres terbaikmu tetap tersimpan.' : `Misi selesai! ${earned} bintang berhasil kamu raih.`);
}
function finishResult() {
  $('#nextQuestion').onclick = nextQuestion;
  $('#answerGrid').style.gridTemplateColumns = '';
  closeQuiz();
  if (state.mission === 'garden' && state.completed.includes('garden')) showToast('Keren! Misi Pasar Perkalian sudah terbuka. 🛍️');
}
function resetQuizButton() {
  $('#nextQuestion').onclick = nextQuestion;
}
function startFirst() {
  openMission('garden');
}
$('#nextQuestion').addEventListener('click', nextQuestion);
$('#closeQuiz').addEventListener('click', () => { closeQuiz(); $('#answerGrid').style.gridTemplateColumns = ''; resetQuizButton(); });
$('#quizModal').addEventListener('click', (e) => { if (e.target === $('#quizModal')) { closeQuiz(); $('#answerGrid').style.gridTemplateColumns = ''; resetQuizButton(); } });
$$('.mission-card').forEach(card => {
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  const missionId = card.classList.contains('garden-card') ? 'garden' : 'market';
  card.addEventListener('click', () => { resetQuizButton(); $('#answerGrid').style.gridTemplateColumns = ''; openMission(missionId); });
  card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); resetQuizButton(); $('#answerGrid').style.gridTemplateColumns = ''; openMission(missionId); } });
});
['#heroStart','#headerStart','#howStart','#calloutStart'].forEach(sel => $(sel).addEventListener('click', startFirst));
$('#menuToggle').addEventListener('click', () => $('#mainNav').classList.toggle('open'));
$$('#mainNav a').forEach(link => link.addEventListener('click', () => $('#mainNav').classList.remove('open')));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuiz(); });
updateProgressUI();


/* Animasi masuk saat halaman di-scroll */
document.addEventListener('DOMContentLoaded', () => {
  const revealTargets = document.querySelectorAll(
    '.feature-card, .mission-card, .implementation-card, .step, .callout'
  );
  revealTargets.forEach((el, index) => {
    el.classList.add('reveal-on-scroll');
    el.style.transitionDelay = `${(index % 4) * 90}ms`;
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }
});
