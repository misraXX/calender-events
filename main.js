let allEvents = [];
let filteredEvents = [];

const isMobile = window.innerWidth <= 768;
document.getElementById("list-view").style.display = isMobile ? "block" : "none";
document.getElementById("month-view").style.display = isMobile ? "none" : "block";

fetch("https://script.google.com/macros/s/AKfycbzb09LsiJ7OsVVMw8aDDU5JQWV9BTuOeBwnJ1toxKOg9_zS617cjClsiLHAtzWaah53/exec")
  .then(res => res.json())
  .then(data => {
    allEvents = data.map(e => {
      const dateObj = new Date(e.date);
      const dayNames = ['日','月','火','水','木','金','土'];
      const dow = dayNames[dateObj.getDay()];
      const dateLabel = `${e.date}（${dow}）`;
      return { ...e, dateObj, dateLabel };
    });
    filterEvents();
    renderCalendar(allEvents);
  });

function showListView() {
  document.getElementById("list-view").style.display = "block";
  document.getElementById("month-view").style.display = "none";
}

function showMonthView() {
  document.getElementById("list-view").style.display = "none";
  document.getElementById("month-view").style.display = "block";
}

function filterEvents() {
  const today = new Date();
  const min = new Date(today);
  const max = new Date(today);
  min.setDate(today.getDate() - 3);
  max.setDate(today.getDate() + 3);

  filteredEvents = allEvents.filter(e =>
    e.dateObj >= min && e.dateObj <= max
  );

  renderEvents(filteredEvents, document.getElementById("events"));
}

function renderEvents(events, container) {
  container.innerHTML = "";

  const grouped = {};
  events.forEach(e => {
    const date = e.dateObj;
    const dateStr = date.toISOString().slice(0, 10);
    const dayNames = ['日','月','火','水','木','金','土'];
    const label = `${dateStr}（${dayNames[date.getDay()]}）`;
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(e);
  });

  for (const [dateLabel, group] of Object.entries(grouped)) {
    const groupDiv = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = dateLabel;
    groupDiv.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "event-grid";

    group.forEach(event => {
      const div = document.createElement("div");
      div.className = "event";

      if (event.jpFlag) {
        const flag = document.createElement("img");
        flag.src = event.jpFlag;
        flag.className = "flag";
        div.appendChild(flag);
      }

      let matchHtml = event.match || "";
      if (event.teamLogo1 && event.teamLogo2) {
        matchHtml = `<div class="match-logo">
          <img src="${event.teamLogo1}" alt="team1">
          <span>vs</span>
          <img src="${event.teamLogo2}" alt="team2">
        </div>`;
      }

      const timeStr = event.time && event.time.includes("T")
        ? new Date(event.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : event.time || "未定";

      const imgs = (event.participantImages || []).slice(0, 3).map(p =>
        `<img src="${p}" style="height:24px; border-radius:4px; margin-right:4px;">`
      ).join('');
      const more = (event.participantImages || []).length > 3
        ? `<span>他${event.participantImages.length - 3}名</span>` : '';

      div.innerHTML += `
        <div class="event-title">${event.tournament || ""} / ${event.title || ""}</div>
        <div class="event-meta">🕒 ${timeStr}</div>
        <div class="event-meta">${matchHtml}</div>
        <div class="event-meta">👥 ${imgs}${more}</div>
      `;

      const link = document.createElement("a");
      link.href = `details.html?id=${event.id}`;
      link.appendChild(div);
      grid.appendChild(link);
    });

    groupDiv.appendChild(grid);
    container.appendChild(groupDiv);
  }
}

function renderCalendar(events) {
  const calendarEl = document.getElementById("calendar");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const grouped = {};
  events.forEach(e => {
    const dateStr = new Date(e.date).toISOString().slice(0, 10);
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(e);
  });

  let html = `<table class="month-calendar"><thead><tr>`;
  ['日','月','火','水','木','金','土'].forEach(d => html += `<th>${d}</th>`);
  html += `</tr></thead><tbody><tr>`;

  for (let i = 0; i < startDayOfWeek; i++) html += `<td></td>`;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().slice(0, 10);
    const dayEvents = grouped[dateStr] || [];

    html += `<td class="calendar-cell" data-date="${dateStr}">`;
    html += `<div class="day-number">${d}</div>`;
    if (dayEvents.length > 0) {
      html += dayEvents.map(event => {
        const matchHtml = event.teamLogo1 && event.teamLogo2 ? `
          <div class="match-logo">
            <img src="${event.teamLogo1}" alt="team1" style="height:20px;">
            <span>vs</span>
            <img src="${event.teamLogo2}" alt="team2" style="height:20px;">
          </div>` : `<div>${event.match || ""}</div>`;

        const gameLogo = event.gameLogo
          ? `<img src="${event.gameLogo}" alt="game" style="height:20px;">`
          : event.game || "";

        const eventLogo = event.eventLogo
          ? `<img src="${event.eventLogo}" alt="event" style="height:20px;">`
          : event.tournament || "";

        return `
          <a href="details.html?id=${event.id}" style="text-decoration: none; color: inherit;">
            <div class="event-mark">
              ${eventLogo} / ${event.title || ""}
              <br>
              ${matchHtml}
              <br>
              ${gameLogo}
            </div>
          </a>`;
      }).join('');
    }
    html += `</td>`;
    if ((startDayOfWeek + d) % 7 === 0) html += `</tr><tr>`;
  }

  html += `</tr></tbody></table>`;
  calendarEl.innerHTML = html;
}
