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
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dow = dayNames[dateObj.getDay()];
      const dateLabel = `${e.date}（${dow}）`;
      return { ...e, dateObj, dateLabel };
    });
    filterEvents();
    renderCalendar(allEvents);
  });

// 📦 カード表示を生成する共通関数
function renderEventCardHTML(event, small = false) {
  const matchHtml = event.teamLogo1 && event.teamLogo2
    ? `<div class="match-logo"><img src="${event.teamLogo1}" alt="team1"><span>vs</span><img src="${event.teamLogo2}" alt="team2"></div>`
    : (event.match || "");

  const timeStr = event.time?.includes("T")
    ? new Date(event.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : (event.time || "未定");

  const imgs = (event.participantImages || []).slice(0, 3).map(p =>
    `<img src="${p}" style="height:24px; border-radius:4px; margin-right:4px;">`
  ).join('');
  const more = (event.participantImages || []).length > 3
    ? `<span>他${event.participantImages.length - 3}名</span>` : '';

  const flagImg = event.jpFlag ? `<img src="${event.jpFlag}" class="flag">` : "";

  return `
    <div class="event${small ? ' small' : ''}">
      ${flagImg}
      <div class="event-title">
        <a href="details.html?id=${event.id}" style="text-decoration: none; color: inherit;">
          ${event.tournament || ""} ${event.title || ""}
        </a>
      </div>
      <div class="event-meta">🕒 ${timeStr}</div>
      <div class="event-meta">${matchHtml}</div>
      <div class="event-meta">👥 ${imgs}${more}</div>
    </div>
  `;
}

function showListView() {
  document.getElementById("list-view").style.display = "block";
  document.getElementById("month-view").style.display = "none";
}

function showMonthView() {
  document.getElementById("list-view").style.display = "none";
  document.getElementById("month-view").style.display = "block";
}

// 📆 直近7日だけフィルタ表示
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

// 📅 リスト表示の描画
function renderEvents(events, container) {
  container.innerHTML = "";

  const grouped = {};
  events.forEach(e => {
    const label = e.dateLabel;
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
      const html = renderEventCardHTML(event);
      grid.innerHTML += html;
    });

    groupDiv.appendChild(grid);
    container.appendChild(groupDiv);
  }
}

// 📅 月表示の描画
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
  events.forEach(event => {
    const dateStr = event.dateObj.toISOString().slice(0, 10);
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(event);
  });

  let html = `<table class="month-calendar"><thead><tr>`;
  ['日', '月', '火', '水', '木', '金', '土'].forEach(d => html += `<th>${d}</th>`);
  html += `</tr></thead><tbody><tr>`;

  for (let i = 0; i < startDayOfWeek; i++) html += `<td></td>`;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().slice(0, 10);
    const dayEvents = grouped[dateStr] || [];

    html += `<td class="calendar-cell"><div class="day-number">${d}</div>`;
    html += dayEvents.map(e => renderEventCardHTML(e, true)).join('');
    html += `</td>`;

    if ((startDayOfWeek + d) % 7 === 0) html += `</tr><tr>`;
  }

  html += `</tr></tbody></table>`;
  calendarEl.innerHTML = html;
}
