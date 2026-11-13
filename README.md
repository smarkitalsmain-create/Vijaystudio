# Vijyaz Studio

Website for Vijyaz Studio, Jaipur: artist-led sessions for individuals and teams.

Plain HTML, CSS and JavaScript with no build step.

- `index.html` – home
- `for-you.html` – 1-on-1 sessions and DIY kits
- `for-teams.html` – corporate workshops, retreats and the playbook
- `creative-circle.html` – The Creative Circle, annual partnership plans for venues
- `vijyaz-at-work.html` – Vijyaz at Work, proposal-led workshops for corporate teams
- `register.html` – registration and enquiry form; `?program=` preselects the interest (for example `creative-circle-ritual` or `vijyaz-at-work`)

Preview locally with `node serve.mjs`, then open http://localhost:4173.

Forms email connect@vijyazstudio.in through FormSubmit, which also sends the visitor a confirmation. If that request fails, the form hands the visitor off to WhatsApp or email.
