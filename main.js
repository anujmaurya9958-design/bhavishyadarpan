// ── STAR BACKGROUND ──
const canvas = document.getElementById('stars-bg');
const ctx = canvas.getContext('2d');
let stars = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.003 + 0.001,
      offset: Math.random() * Math.PI * 2
    });
  }
}

function drawStars(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.offset));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232,184,75,${a})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

resize();
initStars();
drawStars(0);
window.addEventListener('resize', () => { resize(); initStars(); });

// ── SCROLL REVEAL ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .alert-item, .num-info-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── NUMEROLOGY: MULANK & BHAGYANK ──
const NUM_MEANINGS = {
  1: { graha: 'Surya (Sun)',     text: 'Natural leader with confidence, willpower and a strong sense of independence.' },
  2: { graha: 'Chandra (Moon)',  text: 'Gentle, imaginative and emotionally aware. Works best through cooperation and care.' },
  3: { graha: 'Guru (Jupiter)',  text: 'Wise, optimistic and inclined towards learning, teaching and guiding others.' },
  4: { graha: 'Rahu',            text: 'Practical and hard-working with an unconventional way of thinking.' },
  5: { graha: 'Budh (Mercury)',  text: 'Quick-minded, curious and communicative. Adapts easily to change.' },
  6: { graha: 'Shukra (Venus)',  text: 'Loving, artistic and drawn to beauty, comfort and harmonious relationships.' },
  7: { graha: 'Ketu',            text: 'Thoughtful and introspective, with a spiritual and analytical nature.' },
  8: { graha: 'Shani (Saturn)',  text: 'Disciplined and patient. Success comes through steady effort and learning from karma.' },
  9: { graha: 'Mangal (Mars)',   text: 'Courageous, energetic and driven, with strong determination to act.' }
};

function reduceToDigit(n) {
  while (n > 9) {
    n = String(n).split('').reduce((sum, d) => sum + Number(d), 0);
  }
  return n;
}

function digitSum(str) {
  return str.replace(/\D/g, '').split('').reduce((sum, d) => sum + Number(d), 0);
}

function calcNumbers(dobValue) {
  // dobValue is "YYYY-MM-DD"
  const parts = dobValue.split('-');
  if (parts.length !== 3) return null;
  const day = parts[2];
  const mulank = reduceToDigit(digitSum(day));
  const bhagyank = reduceToDigit(digitSum(dobValue));
  if (!mulank || !bhagyank) return null;
  return { mulank, bhagyank };
}

// ── PHONE HELPER ──
function cleanPhone(raw) {
  const p = (raw || '').replace(/[\s\-()]/g, '');
  return /^\+?\d{10,15}$/.test(p) ? p : null;
}

// ── SUPABASE ──
const SUPABASE_URL = "https://wyoifniqvjlftzyrwnzr.supabase.co";
const SUPABASE_KEY = "sb_publishable_ICIEHqlXTsUECQTsurLmhQ_jPa2wy7B";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function formatSlot(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }) + ' IST';
}

document.addEventListener("DOMContentLoaded", () => {

  // ── NUMEROLOGY CALCULATOR ──
  const numBtn = document.getElementById('numCalcBtn');
  if (numBtn) {
    numBtn.addEventListener('click', () => {
      const dobVal = document.getElementById('numDob').value;
      if (!dobVal) {
        alert('Please select your date of birth');
        return;
      }
      const res = calcNumbers(dobVal);
      if (!res) {
        alert('Please enter a valid date of birth');
        return;
      }
      const m = NUM_MEANINGS[res.mulank];
      const b = NUM_MEANINGS[res.bhagyank];
      document.getElementById('mulankDigit').textContent = res.mulank;
      document.getElementById('mulankGraha').textContent = m.graha;
      document.getElementById('mulankText').textContent = m.text;
      document.getElementById('bhagyankDigit').textContent = res.bhagyank;
      document.getElementById('bhagyankGraha').textContent = b.graha;
      document.getElementById('bhagyankText').textContent = b.text;
      document.getElementById('numResult').hidden = false;
    });
  }

  // ── CONSULTATION FORM ──
  const btn = document.getElementById("submitBtn");

  if (btn) {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const phoneRaw = document.getElementById("phone").value;
      const dob = document.getElementById("dob").value;
      const service = document.getElementById("service").value;
      const question = document.getElementById("question").value;

      if (!name) {
        alert("Please enter your name");
        return;
      }

      const phone = cleanPhone(phoneRaw);
      if (!phone) {
        alert("Please enter a valid phone / WhatsApp number (10 digits)");
        return;
      }

      btn.disabled = true;
      btn.innerText = "Submitting...";

      const { error } = await supabaseClient
        .from("consultations")
        .insert([{ name, phone, dob: dob || null, service, question }]);

      btn.disabled = false;
      btn.innerText = "Submit Request";

      if (error) {
        console.error(error);
        alert("Submission failed");
        return;
      }

      alert("🙏 Consultation request submitted successfully");

      document.getElementById("name").value = "";
      document.getElementById("phone").value = "";
      document.getElementById("dob").value = "";
      document.getElementById("service").value = "";
      document.getElementById("question").value = "";
    });
  }

  // ── LIVE SESSION SLOTS & BOOKING ──
  const slotSelect = document.getElementById('lv-slot');
  const lvBtn = document.getElementById('lvSubmit');
  const nextSlotEl = document.getElementById('nextSlot');
  const lvHint = document.getElementById('lvHint');

  async function loadSlots() {
    if (!slotSelect) return;

    const { data, error } = await supabaseClient
      .from('live_slots_open')
      .select('id, slot_time, seats_left')
      .order('slot_time', { ascending: true });

    slotSelect.innerHTML = '';

    if (error) {
      console.error(error);
      slotSelect.innerHTML = '<option value="">Could not load slots</option>';
      slotSelect.disabled = true;
      lvBtn.disabled = true;
      nextSlotEl.textContent = 'Slots are opened by us — please check back soon.';
      return;
    }

    if (!data || data.length === 0) {
      slotSelect.innerHTML = '<option value="">No slots available right now</option>';
      slotSelect.disabled = true;
      lvBtn.disabled = true;
      nextSlotEl.textContent = 'Slots are opened by us — new slots coming soon.';
      lvHint.textContent = 'No slot is open for booking at the moment. New slots will be announced soon.';
      return;
    }

    const first = document.createElement('option');
    first.value = '';
    first.textContent = 'Select a slot';
    slotSelect.appendChild(first);

    data.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = formatSlot(s.slot_time) + (s.seats_left <= 3 ? ` (${s.seats_left} left)` : '');
      slotSelect.appendChild(o);
    });

    slotSelect.disabled = false;
    lvBtn.disabled = false;
    lvHint.textContent = '';
    nextSlotEl.textContent = formatSlot(data[0].slot_time);
  }

  if (lvBtn) {
    loadSlots();

    lvBtn.addEventListener('click', async () => {
      const name = document.getElementById('lv-name').value.trim();
      const phone = cleanPhone(document.getElementById('lv-phone').value);
      const slotId = slotSelect.value;
      const question = document.getElementById('lv-question').value.trim();

      if (!name) { alert('Please enter your name'); return; }
      if (!phone) { alert('Please enter a valid phone / WhatsApp number (10 digits)'); return; }
      if (!slotId) { alert('Please select a slot'); return; }

      lvBtn.disabled = true;
      lvBtn.innerText = 'Booking...';

      const { error } = await supabaseClient
        .from('live_bookings')
        .insert([{ slot_id: slotId, name, phone, question: question || null }]);

      lvBtn.innerText = 'Book This Slot';

      if (error) {
        console.error(error);
        lvBtn.disabled = false;
        if ((error.message || '').toLowerCase().includes('slot')) {
          alert('Sorry, this slot has just been filled or closed. Please pick another slot.');
        } else {
          alert('Booking failed. Please try again.');
        }
        loadSlots();
        return;
      }

      alert('🙏 Your live session is booked. We will contact you on your number.');
      document.getElementById('lv-name').value = '';
      document.getElementById('lv-phone').value = '';
      document.getElementById('lv-question').value = '';
      loadSlots();
    });
  }

  // ── REVIEWS ──
  const reviewList = document.getElementById('reviewList');
  const reviewEmpty = document.getElementById('reviewEmpty');
  const starInput = document.getElementById('starInput');
  const rvBtn = document.getElementById('rvSubmit');
  let rating = 0;

  function paintStars() {
    starInput.querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', Number(b.dataset.v) <= rating);
    });
  }

  if (starInput) {
    starInput.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        rating = Number(b.dataset.v);
        paintStars();
      });
    });
  }

  function renderReview(r) {
    const card = document.createElement('div');
    card.className = 'testimonial-card';

    const stars = document.createElement('div');
    stars.className = 'stars';
    stars.textContent = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);

    const text = document.createElement('p');
    text.className = 'testimonial-text';
    text.textContent = r.comment;

    const author = document.createElement('div');
    author.className = 'testimonial-author';
    author.textContent = r.name;

    card.append(stars, text, author);

    if (r.city) {
      const role = document.createElement('div');
      role.className = 'testimonial-role';
      role.textContent = r.city;
      card.appendChild(role);
    }
    return card;
  }

  async function loadReviews() {
    if (!reviewList) return;

    const { data, error } = await supabaseClient
      .from('testimonials')
      .select('name, city, rating, comment')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error(error);
      return;
    }

    reviewList.querySelectorAll('.testimonial-card').forEach(c => c.remove());

    if (!data || data.length === 0) {
      reviewEmpty.hidden = false;
      return;
    }

    reviewEmpty.hidden = true;
    data.forEach(r => reviewList.appendChild(renderReview(r)));
  }

  loadReviews();

  if (rvBtn) {
    rvBtn.addEventListener('click', async () => {
      const name = document.getElementById('rv-name').value.trim();
      const city = document.getElementById('rv-city').value.trim();
      const comment = document.getElementById('rv-comment').value.trim();

      if (!name) { alert('Please enter your name'); return; }
      if (!rating) { alert('Please select a rating'); return; }
      if (comment.length < 10) { alert('Please write a few words about your experience'); return; }

      rvBtn.disabled = true;
      rvBtn.innerText = 'Posting...';

      const { error } = await supabaseClient
        .from('testimonials')
        .insert([{ name, city: city || null, rating, comment }]);

      rvBtn.disabled = false;
      rvBtn.innerText = 'Post Review';

      if (error) {
        console.error(error);
        alert('Could not post your review. Please try again.');
        return;
      }

      alert('🙏 Thank you! Your review will appear after approval.');
      document.getElementById('rv-name').value = '';
      document.getElementById('rv-city').value = '';
      document.getElementById('rv-comment').value = '';
      rating = 0;
      paintStars();
    });
  }

});
