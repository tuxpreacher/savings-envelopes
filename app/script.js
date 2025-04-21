let weeklyChart = null;

function getSelectedYear() {
  return document.getElementById('yearSelect').value;
}

async function loadYearOptions() {
    const now = new Date();
    const startYear = 2024;
    const endYear = now.getFullYear();
    const select = document.getElementById('yearSelect');
  
    // Remember current selection, or default to current year
    const current = select.value || endYear.toString();
  
    select.innerHTML = '';
    for (let y = endYear; y >= startYear; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y.toString() === current) opt.selected = true;
      select.appendChild(opt);
    }
}
  

async function loadAvailableWeeks() {
  const year = getSelectedYear();
  if (!year) return;

  const select = document.getElementById('weekSelect');
  const response = await fetch(`/available-weeks?year=${year}`);
  if (response.ok) {
    const weeks = await response.json();
    select.innerHTML = '';
    if (weeks.length === 0) {
      select.innerHTML = '<option disabled>No weeks available</option>';
      select.disabled = true;
    } else {
      select.disabled = false;
      for (const week of weeks.reverse()) {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = week;
        select.appendChild(option);
      }
    }
  }
}

function pickSelectedWeek() {
  const select = document.getElementById('weekSelect');
  if (select.value) {
    pick(select.value);
  }
}

async function pick(week = null) {
  const resultDiv = document.getElementById('result');
  const url = week ? `/pick?week=${week}` : '/pick';
  const response = await fetch(url, { method: 'POST' });

  if (response.ok) {
    const data = await response.json();
    resultDiv.innerHTML = `
      Picked: <strong>${data.picked[0]}</strong> and <strong>${data.picked[1]}</strong><br>
      Remaining: ${data.remaining}<br>
      Calendar Week: ${data.week}
    `;
    refreshAll();
  } else {
    const error = await response.json();
    const msg = `🚫 Uh oh! ${error.error || "Something went wrong."}`;

    const errorBox = document.getElementById('errorMessage');
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
    setTimeout(() => {
        errorBox.style.display = 'none';
    }, 5000);

    resultDiv.textContent = ''; // Clear results on error
  }
}

async function loadHistory() {
  const year = getSelectedYear();
  if (!year) return;
  const response = await fetch(`/history?year=${year}`);
  const tableBody = document.getElementById('historyTable');
  if (response.ok) {
    const data = await response.json();
    tableBody.innerHTML = '';
    const sortedWeeks = Object.keys(data).sort().reverse();
    for (const week of sortedWeeks) {
      const picks = data[week].map(p => `${p[0]} & ${p[1]}`).join(', ');
      const row = `<tr><td>${week}</td><td>${picks}</td></tr>`;
      tableBody.innerHTML += row;
    }
  }
}

async function loadSummary() {
  const year = getSelectedYear();
  if (!year) return;
  const response = await fetch(`/summary?year=${year}`);
  const div = document.getElementById('summary');
  const progress = document.getElementById('progressBar');
  const weekSelect = document.getElementById('weekSelect');
  const pickBtn = document.querySelector('button[onclick="pick()"]');
  const pastWeekBtn = document.querySelector('button[onclick="pickSelectedWeek()"]');

  if (response.ok) {
    const data = await response.json();

    const weeksPicked = data.weekly_totals ? Object.keys(data.weekly_totals).length : 0;
    const totalPicks = data.count;
    const remainingPicks = 50 - weeksPicked;

    div.innerHTML = `
      Sum of all picked numbers: <strong>${data.sum}</strong><br>
      Total numbers picked: ${totalPicks}<br>
      <strong style="color: ${remainingPicks === 0 ? 'red' : 'inherit'};">
        Picks Remaining: ${remainingPicks} of 50
      </strong>
    `;

    const percent = (weeksPicked / 50) * 100;
    progress.style.width = `${percent}%`;
    progress.style.backgroundColor = remainingPicks === 0 ? 'red' : '#4caf50';

    pickBtn.disabled = remainingPicks === 0;
    pastWeekBtn.disabled = remainingPicks === 0;
    weekSelect.disabled = remainingPicks === 0;

    if (remainingPicks === 0 && !window._confettiFired) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      window._confettiFired = true;
    }

    drawChart(data.weekly_totals);
  }
}

function drawChart(weeklyTotals) {
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  const labels = Object.keys(weeklyTotals).sort();
  const values = labels.map(week => weeklyTotals[week]);

  const max = Math.max(...values);
  const min = Math.min(...values);

  const colors = values.map(value => {
    if (value === max) return 'red';
    if (value === min) return 'green';
    return 'blue';
  });

  if (weeklyChart) {
    weeklyChart.destroy();
  }

  weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Weekly Pick Total',
        data: values,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `Total: ${context.parsed.y}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });

  renderLegend();
}

function renderLegend() {
  const legend = document.getElementById('chartLegend');
  legend.innerHTML = `
    <span style="display:inline-block; width: 12px; height: 12px; background-color: red; margin-right: 5px;"></span>
    <strong>Highest Week</strong><br>
    <span style="display:inline-block; width: 12px; height: 12px; background-color: green; margin-right: 5px;"></span>
    <strong>Lowest Week</strong><br>
    <span style="display:inline-block; width: 12px; height: 12px; background-color: blue; margin-right: 5px;"></span>
    <strong>Other Weeks</strong>
  `;
}

function refreshAll() {
  loadAvailableWeeks();
  loadHistory();
  loadSummary();
}

async function submitAdmin(event) {
    event.preventDefault();
  
    const week = document.getElementById('adminWeek').value.trim();
    const nums = document.getElementById('adminNumbers').value.trim().split(',').map(n => parseInt(n));
    const msg = document.getElementById('adminResponse');
  
    msg.classList.remove('success', 'error');
    msg.style.display = 'none';
  
    if (nums.length !== 2 || nums.some(isNaN)) {
      msg.textContent = '🚫 Please enter exactly two numbers.';
      msg.classList.add('error');
      msg.style.display = 'block';
      return;
    }
  
    const response = await fetch('/admin/add-pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week, numbers: nums })
    });
  
    const result = await response.json();
  
    if (response.ok) {
      msg.textContent = `✅ ${result.message}`;
      msg.classList.add('success');
      msg.style.display = 'block';
      refreshAll();
    } else {
      msg.textContent = `🚫 ${result.error || "Something went wrong."}`;
      msg.classList.add('error');
      msg.style.display = 'block';
    }
  
    setTimeout(() => {
      msg.style.display = 'none';
    }, 5000);
}
  

window.onload = async () => {
    await loadYearOptions();
  
    const select = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear().toString();
  
    if (!select.value) {
      select.value = currentYear;
    }
  
    refreshAll();
};
  