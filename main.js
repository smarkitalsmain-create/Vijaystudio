// Vijyaz Studio — shared behaviour (menu, reveal, marquee, forms)

// Enquiries are emailed to the studio through FormSubmit (formsubmit.co), which
// also sends the visitor a confirmation. If that request fails, the form falls
// back to handing the visitor off to WhatsApp or email.
const WHATSAPP_NUMBER = "918824928835";
const STUDIO_EMAIL = "connect@vijyazstudio.in";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${STUDIO_EMAIL}`;
const SEND_TIMEOUT_MS = 15000; // after this, stop waiting and offer WhatsApp / email

document.documentElement.classList.add("js");

// ----- mobile menu + current page -----
const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector(".site-nav");
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  });
  const here = location.pathname.split("/").pop().replace(/\.html$/, "") || "index";
  nav.querySelectorAll("a").forEach((a) => {
    const target = a.getAttribute("href").replace(/\.html$/, "");
    if (target === here) a.setAttribute("aria-current", "page");
  });
}

// ----- scroll reveal -----
const revealables = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add("in"));
}

// ----- marquee: duplicate the prints so the loop is seamless -----
document.querySelectorAll(".marquee-track").forEach((track) => {
  [...track.children].forEach((child) => {
    const clone = child.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });
});

// ----- registration: audience toggle + preselected program -----
const regForm = document.querySelector("#register-form");
if (regForm) {
  const program = regForm.elements.program;
  const teamFields = regForm.querySelectorAll("[data-team-only]");
  const audienceOf = { "one-on-one": "myself", "diy-kits": "myself", "corporate-workshops": "team", "retreat-offsite": "team" };

  const applyAudience = (audience) => {
    [...program.options].forEach((opt) => {
      if (!opt.value) return;
      opt.hidden = opt.disabled = audienceOf[opt.value] !== audience;
    });
    if (program.value && audienceOf[program.value] !== audience) program.value = "";
    teamFields.forEach((el) => {
      el.hidden = audience !== "team";
      el.querySelectorAll("input").forEach((input) => (input.disabled = audience !== "team"));
    });
  };

  const params = new URLSearchParams(location.search);
  const wanted = params.get("program");
  const audience = audienceOf[wanted] || (params.get("for") === "team" ? "team" : "myself");
  regForm.elements.audience.value = audience;
  applyAudience(audience);
  if (audienceOf[wanted]) program.value = wanted;

  regForm.querySelectorAll("[name=audience]").forEach((radio) =>
    radio.addEventListener("change", () => applyAudience(radio.value))
  );
}

// ----- form submission -----
const labelFor = (form, field) => {
  if (field.tagName === "SELECT") return field.selectedOptions[0]?.textContent.trim();
  if (field.type === "radio") return field.closest("label").textContent.trim();
  return field.value.trim();
};

document.querySelectorAll("form[data-enquiry]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const lines = [];
    const data = {};
    [...form.elements].forEach((field) => {
      if (!field.name || field.name.startsWith("_") || field.disabled || (field.type === "radio" && !field.checked)) return;
      const value = labelFor(form, field);
      if (!value) return;
      // FormSubmit needs the visitor's address under "email" to send the confirmation
      data[field.name === "email" ? "email" : field.dataset.label || field.name] = value;
      lines.push(`${field.dataset.label || field.name}: ${value}`);
    });
    const message = `${form.dataset.enquiry}\n\n${lines.join("\n")}`;
    const done = form.parentElement.querySelector(".handoff");
    const button = form.querySelector("[type=submit]");

    if (FORM_ENDPOINT) {
      button.disabled = true;
      button.textContent = "Sending…";
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            ...data,
            _subject: `${form.dataset.enquiry}: ${data.Name || "website"}`,
            _template: "table",
            _autoresponse: form.dataset.reply,
          }),
        });
        const result = await res.json();
        if (!res.ok || String(result.success) !== "true") throw new Error(result.message || String(res.status));
        done.querySelector("[data-sent]").hidden = false;
        done.querySelector("[data-send]").hidden = true;
        done.querySelector("h3").textContent = "Thank you.";
      } catch {
        // fall through to the WhatsApp / email handoff below
      }
    }

    done.querySelector("[data-whatsapp]").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    done.querySelector("[data-email]").href =
      `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(form.dataset.enquiry)}&body=${encodeURIComponent(message)}`;
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ block: "center", behavior: "smooth" });
  });
});
