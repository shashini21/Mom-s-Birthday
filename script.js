// Mom's 50th Birthday invitation
// Google Apps Script endpoint for the RSVP Google Sheet.
const RSVP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzbH2dWwog2NLWvpIptmTGeKciiO7vn4nBk72dUSaDC7AStCFpRG_zfiomDmnYRP8o7/exec";

document.addEventListener("DOMContentLoaded", () => {
  // Personalize the invitation with ?guest=Name
  const params = new URLSearchParams(window.location.search);
  const guest = (params.get("guest") || "").trim();
  const safeGuest = guest.replace(/[<>]/g, "");
  const guestName = document.getElementById("guestName");
  const rsvpGuest = document.getElementById("rsvpGuest");
  const nameInput = document.getElementById("rsvpName");

  if (safeGuest) {
    if (guestName) guestName.textContent = safeGuest;
    if (rsvpGuest) rsvpGuest.textContent = `Dear ${safeGuest}`;
    if (nameInput) nameInput.value = safeGuest;
  }

  // Background music button. Browsers require a user gesture before audio plays.
  const music = document.getElementById("birthdayMusic");
  const musicButton = document.getElementById("musicButton");
  const musicLabel = document.getElementById("musicLabel");
  if (music && musicButton) {
    musicButton.addEventListener("click", async () => {
      if (music.paused) {
        try {
          await music.play();
          if (musicLabel) musicLabel.textContent = "Pause music";
          musicButton.setAttribute("aria-label", "Pause background music");
        } catch (error) {
          if (musicLabel) musicLabel.textContent = "Add music file";
        }
      } else {
        music.pause();
        if (musicLabel) musicLabel.textContent = "Play music";
        musicButton.setAttribute("aria-label", "Play background music");
      }
    });
  }

  // Pause automatic scrolling while a visitor interacts; resume afterward.
  let scrollTimer;
  let autoScrollEnabled = true;
  const pauseAutoScroll = () => {
    autoScrollEnabled = false;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      autoScrollEnabled = true;
    }, 2500);
  };
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((eventName) => {
    window.addEventListener(eventName, pauseAutoScroll, { passive: true });
  });

  // Submit RSVP to Google Apps Script. "no-cors" prevents reading Google's
  // response, so this reports that the request was sent, not confirmed saved.
  const form = document.getElementById("rsvpForm");
  const feedback = document.getElementById("rsvpFeedback");
  const submitButton = document.getElementById("rsvpSubmit");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const payload = {
        guestName: String(formData.get("guestName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        status: String(formData.get("status") || ""),
        guests: Number(formData.get("guests") || 1),
        message: String(formData.get("message") || "").trim()
      };

      if (!payload.guestName || !["Yes", "No", "Maybe"].includes(payload.status)
          || !Number.isInteger(payload.guests) || payload.guests < 1 || payload.guests > 20) {
        if (feedback) feedback.textContent = "Please check your name, response, and guest count.";
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
      }
      if (feedback) feedback.textContent = "Sending your RSVP…";

      try {
        await fetch(RSVP_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });

        if (feedback) {
          feedback.textContent = "Your RSVP request was sent. Please check the RSVP sheet to confirm it was recorded.";
        }
        form.reset();
        if (nameInput && safeGuest) nameInput.value = safeGuest;
        const guestCountInput = document.getElementById("rsvpGuests");
        if (guestCountInput) guestCountInput.value = "1";
      } catch (error) {
        console.error("RSVP submission error:", error);
        if (feedback) feedback.textContent = "We couldn't send your RSVP. Please check your internet connection and try again.";
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Send RSVP";
        }
      }
    });
  }
});
