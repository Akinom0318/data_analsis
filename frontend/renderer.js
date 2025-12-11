let pieChart, timelineChart, dateChart;
let rawData = [];
let selectedApps = new Set();

// Format seconds to hours and minutes
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

// Get all unique apps from data
function getAllApps(data) {
  const apps = new Set();
  data.forEach(entry => apps.add(entry.app));
  return Array.from(apps).sort();
}

// Get date range from data
function getDateRange(data) {
  const dates = data.map(entry => entry.start.split('T')[0]);
  const sortedDates = dates.sort();
  return {
    min: sortedDates[0],
    max: sortedDates[sortedDates.length - 1]
  };
}

// Create app filter checkboxes
function createAppFilters(apps) {
  const container = document.getElementById('appFilters');
  container.innerHTML = '';

  apps.forEach(app => {
    const label = document.createElement('label');
    label.className = 'app-filter-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = app;
    checkbox.checked = true;
    selectedApps.add(app);

    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedApps.add(app);
      } else {
        selectedApps.delete(app);
      }
      applyFilters();
    });

    const span = document.createElement('span');
    span.textContent = app;

    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  });
}

// Initialize date inputs
function initializeDateInputs(dateRange) {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  startDateInput.value = dateRange.min;
  endDateInput.value = dateRange.max;
  startDateInput.min = dateRange.min;
  startDateInput.max = dateRange.max;
  endDateInput.min = dateRange.min;
  endDateInput.max = dateRange.max;
}

// Filter data based on selected apps and date range
function filterData() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  return rawData.filter(entry => {
    const entryDate = entry.start.split('T')[0];
    const isAppSelected = selectedApps.has(entry.app);
    const isInDateRange = entryDate >= startDate && entryDate <= endDate;

    return isAppSelected && isInDateRange;
  });
}

// Process data and calculate total usage per app
function calculateAppUsage(data) {
  const appUsage = {};

  data.forEach(entry => {
    if (!appUsage[entry.app]) {
      appUsage[entry.app] = 0;
    }
    appUsage[entry.app] += entry.duration_sec;
  });

  return appUsage;
}

// Calculate usage by date and app
function calculateDateUsage(data) {
  const dateUsage = {};

  data.forEach(entry => {
    const date = entry.start.split('T')[0];

    if (!dateUsage[date]) {
      dateUsage[date] = {};
    }

    if (!dateUsage[date][entry.app]) {
      dateUsage[date][entry.app] = 0;
    }

    dateUsage[date][entry.app] += entry.duration_sec;
  });

  return dateUsage;
}

// Display app statistics
function displayAppStats(appUsage) {
  const statsContainer = document.getElementById('appStats');
  statsContainer.innerHTML = '';

  const sortedApps = Object.entries(appUsage).sort((a, b) => b[1] - a[1]);

  if (sortedApps.length === 0) {
    statsContainer.innerHTML = '<p class="no-data">No data to display. Please select applications and date range.</p>';
    return;
  }

  sortedApps.forEach(([app, seconds]) => {
    const statItem = document.createElement('div');
    statItem.className = 'stat-item';
    statItem.innerHTML = `
      <span class="app-name">${app}</span>
      <span class="app-time">${formatTime(seconds)}</span>
    `;
    statsContainer.appendChild(statItem);
  });
}

// Create pie chart
function createPieChart(appUsage) {
  const ctx = document.getElementById('pieChart').getContext('2d');

  if (pieChart) {
    pieChart.destroy();
  }

  const labels = Object.keys(appUsage);
  const data = Object.values(appUsage).map(seconds => (seconds / 3600).toFixed(2));

  if (labels.length === 0) {
    return;
  }

  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#E74C3C',
    '#2ECC71',
    '#F39C12',
    '#8E44AD',
    '#1ABC9C',
    '#34495E',
    '#E67E22',
    '#95A5A6',
    '#D35400',
    '#C0392B'
  ];

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#333',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const hours = parseFloat(context.parsed);
              const minutes = Math.round((hours % 1) * 60);
              const wholeHours = Math.floor(hours);
              return `${label}: ${wholeHours}h ${minutes}m`;
            }
          }
        }
      }
    }
  });
}

// Create timeline chart (bar chart showing all apps usage)
function createTimelineChart(appUsage) {
  const ctx = document.getElementById('timelineChart').getContext('2d');

  if (timelineChart) {
    timelineChart.destroy();
  }

  const sortedApps = Object.entries(appUsage).sort((a, b) => b[1] - a[1]);
  const labels = sortedApps.map(([app]) => app);
  const data = sortedApps.map(([, seconds]) => (seconds / 3600).toFixed(2));

  if (labels.length === 0) {
    return;
  }

  timelineChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hours',
        data: data,
        backgroundColor: '#36A2EB',
        borderColor: '#2E86C1',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Applications'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const hours = parseFloat(context.parsed.y);
              const minutes = Math.round((hours % 1) * 60);
              const wholeHours = Math.floor(hours);
              return `${wholeHours}h ${minutes}m`;
            }
          }
        }
      }
    }
  });
}

// Create date-based chart showing app usage per date
function createDateChart(dateUsage) {
  const ctx = document.getElementById('dateChart').getContext('2d');

  if (dateChart) {
    dateChart.destroy();
  }

  const dates = Object.keys(dateUsage).sort();
  const apps = new Set();

  // Collect all unique apps
  Object.values(dateUsage).forEach(dayData => {
    Object.keys(dayData).forEach(app => apps.add(app));
  });

  if (dates.length === 0 || apps.size === 0) {
    return;
  }

  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#E74C3C',
    '#2ECC71',
    '#F39C12',
    '#8E44AD',
    '#1ABC9C',
    '#34495E',
    '#E67E22',
    '#95A5A6',
    '#D35400',
    '#C0392B'
  ];

  const datasets = Array.from(apps).map((app, index) => ({
    label: app,
    data: dates.map(date => {
      const seconds = dateUsage[date][app] || 0;
      return (seconds / 3600).toFixed(2);
    }),
    backgroundColor: colors[index % colors.length],
    borderColor: colors[index % colors.length],
    borderWidth: 1
  }));

  dateChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#333',
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const hours = parseFloat(context.parsed.y);
              const minutes = Math.round((hours % 1) * 60);
              const wholeHours = Math.floor(hours);
              return `${label}: ${wholeHours}h ${minutes}m`;
            }
          }
        }
      }
    }
  });
}

// Apply filters and update visualizations
function applyFilters() {
  const filteredData = filterData();

  if (filteredData.length === 0) {
    displayAppStats({});
    if (pieChart) pieChart.destroy();
    if (timelineChart) timelineChart.destroy();
    if (dateChart) dateChart.destroy();
    return;
  }

  const appUsage = calculateAppUsage(filteredData);
  const dateUsage = calculateDateUsage(filteredData);

  displayAppStats(appUsage);
  createPieChart(appUsage);
  createTimelineChart(appUsage);
  createDateChart(dateUsage);
}

// Load and display data
async function loadData() {
  try {
    const data = await window.electronAPI.readData();

    if (data.length === 0) {
      alert('No data found in data.json');
      return;
    }

    rawData = data;
    const apps = getAllApps(data);
    const dateRange = getDateRange(data);

    createAppFilters(apps);
    initializeDateInputs(dateRange);
    applyFilters();

  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error loading data. Check console for details.');
  }
}

// Select all apps
document.getElementById('selectAllApps').addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('#appFilters input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    selectedApps.add(checkbox.value);
  });
  applyFilters();
});

// Deselect all apps
document.getElementById('deselectAllApps').addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('#appFilters input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    selectedApps.delete(checkbox.value);
  });
  applyFilters();
});

// Apply filters button
document.getElementById('applyFilters').addEventListener('click', () => {
  applyFilters();
});

// Reload button event listener
document.getElementById('reloadBtn').addEventListener('click', () => {
  loadData();
});

// Load data when app opens
window.addEventListener('DOMContentLoaded', () => {
  loadData();
});
