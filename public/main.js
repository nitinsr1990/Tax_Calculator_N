(function(){
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const calculateTax = window.taxEngine && window.taxEngine.calculateTax;
  const computeHeadroom = window.taxEngine && window.taxEngine.computeHeadroom;

  if (!calculateTax) {
    document.body.innerHTML = '<div class="container"><div class="card"><h2>Error</h2><p>Tax engine failed to load. Please refresh and check the browser console.</p></div></div>';
    return;
  }

  const steps = [
    { id: 'basic', title: 'Basic Info' },
    { id: 'income', title: 'Income Details' },
    { id: 'deductions', title: 'Deductions' },
    { id: 'preference', title: 'Regime Preference' },
    { id: 'review', title: 'Review & Calculate' }
  ];

  const state = {
    age_category: 'below60',
    gross_income: 0,
    other_income: 0,
    deductions: {
      section_80C: 0,
      section_80D: 0,
      hra_exemption: 0,
      home_loan_interest_24b: 0,
      nps_80ccd_1b: 0,
      nps_80ccd_2: 0,
      other_deductions: 0
    },
    regime_preference: 'compare'
  };

  let stepIndex = 0;
  const stepContainer = document.getElementById('step-container');
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const resultsEl = document.getElementById('results');
  const resultsContent = document.getElementById('results-content');
  const stepPill = document.getElementById('step-pill');
  const wizardTitle = document.getElementById('wizard-title');
  const dashboardGrid = document.querySelector('.dashboard-grid');

  if (!stepContainer || !backBtn || !nextBtn || !resultsEl || !resultsContent || !stepPill || !wizardTitle || !dashboardGrid) {
    console.error('Missing required DOM elements for app.');
    return;
  }

  backBtn.addEventListener('click', () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderStep();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (stepIndex < steps.length - 1) {
      stepIndex += 1;
      renderStep();
    } else {
      onCalculate();
    }
  });

  function renderStep() {
    const step = steps[stepIndex];
    resultsEl.classList.add('hidden');
    dashboardGrid.classList.remove('results-hidden');
    backBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    stepPill.classList.remove('hidden');
    stepPill.textContent = `Step ${stepIndex + 1} of ${steps.length}`;
    wizardTitle.textContent = step.title;
    stepContainer.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'step card';
    card.appendChild(renderStepContent(step.id));
    stepContainer.appendChild(card);
  }

  function renderStepContent(id) {
    const wrapper = document.createElement('div');
    if (id === 'basic') {
      const intro = document.createElement('p');
      intro.textContent = 'Select your age category and confirm resident status for FY 2026-27.';
      wrapper.appendChild(intro);
      wrapper.appendChild(renderToggle('Age category', ['below60','60to79','80plus'], state.age_category, (value) => {
        state.age_category = value;
        renderStep();
      }));
      const note = document.createElement('p');
      note.className = 'label';
      note.textContent = 'Resident individual is assumed. Resident status is fixed for v1.';
      wrapper.appendChild(note);
    } else if (id === 'income') {
      wrapper.appendChild(labeledNumber('Gross annual salary (₹)', state.gross_income, (value) => state.gross_income = Number(value)));
      wrapper.appendChild(labeledNumber('Other taxable income (₹)', state.other_income, (value) => state.other_income = Number(value)));
    } else if (id === 'deductions') {
      wrapper.appendChild(labeledNumber('Section 80C (₹)', state.deductions.section_80C, (value) => state.deductions.section_80C = Number(value)));
      wrapper.appendChild(labeledNumber('Section 80D (₹)', state.deductions.section_80D, (value) => state.deductions.section_80D = Number(value)));
      wrapper.appendChild(labeledNumber('HRA exemption (₹)', state.deductions.hra_exemption, (value) => state.deductions.hra_exemption = Number(value)));
      wrapper.appendChild(labeledNumber('Home loan interest 24b (₹)', state.deductions.home_loan_interest_24b, (value) => state.deductions.home_loan_interest_24b = Number(value)));
      wrapper.appendChild(labeledNumber('NPS 80CCD(1B) (₹)', state.deductions.nps_80ccd_1b, (value) => state.deductions.nps_80ccd_1b = Number(value)));
      wrapper.appendChild(labeledNumber('Employer NPS 80CCD(2) (₹)', state.deductions.nps_80ccd_2, (value) => state.deductions.nps_80ccd_2 = Number(value)));
      wrapper.appendChild(labeledNumber('Other deductions (₹)', state.deductions.other_deductions, (value) => state.deductions.other_deductions = Number(value)));
    } else if (id === 'preference') {
      wrapper.appendChild(renderToggle('Regime preference', ['compare','old','new'], state.regime_preference, (value) => {
        state.regime_preference = value;
        renderStep();
      }));
      const note = document.createElement('p');
      note.className = 'label';
      note.textContent = 'The app always calculates both regimes; this only controls the preferred highlight.';
      wrapper.appendChild(note);
    } else if (id === 'review') {
      const optionLabels = {
        below60: '<60',
        '60to79': '60-79',
        '80plus': '80+'
      };
      const table = document.createElement('table');
      table.className = 'review-table';
      table.innerHTML = `
        <tbody>
          <tr><th>Age category</th><td>${optionLabels[state.age_category] || state.age_category}</td></tr>
          <tr><th>Gross salary entered</th><td>₹${formatNumber(state.gross_income)}</td></tr>
          <tr><th>Other income entered</th><td>₹${formatNumber(state.other_income)}</td></tr>
          <tr><th>Regime preference</th><td>${state.regime_preference}</td></tr>
          <tr><th colspan="2">Deductions</th></tr>
          <tr><td class="indent">Section 80C</td><td>₹${formatNumber(state.deductions.section_80C)}</td></tr>
          <tr><td class="indent">Section 80D</td><td>₹${formatNumber(state.deductions.section_80D)}</td></tr>
          <tr><td class="indent">HRA exemption</td><td>₹${formatNumber(state.deductions.hra_exemption)}</td></tr>
          <tr><td class="indent">Home loan interest 24b</td><td>₹${formatNumber(state.deductions.home_loan_interest_24b)}</td></tr>
          <tr><td class="indent">NPS 80CCD(1B)</td><td>₹${formatNumber(state.deductions.nps_80ccd_1b)}</td></tr>
          <tr><td class="indent">NPS 80CCD(2)</td><td>₹${formatNumber(state.deductions.nps_80ccd_2)}</td></tr>
          <tr><td class="indent">Other deductions</td><td>₹${formatNumber(state.deductions.other_deductions)}</td></tr>
        </tbody>
      `;
      wrapper.appendChild(table);
      const hint = document.createElement('p');
      hint.textContent = 'Click Calculate (Next) to compute results and see the comparison.';
      wrapper.appendChild(hint);
    }
    return wrapper;
  }

  function renderToggle(label, options, selected, onChange) {
    const optionLabels = {
      below60: '<60',
      '60to79': '60-79',
      '80plus': '80+'
    };

    const field = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'label';
    title.textContent = label;
    field.appendChild(title);
    const row = document.createElement('div');
    row.className = 'side-row';
    options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = option === selected ? 'btn btn-toggle active' : 'btn btn-toggle';
      button.textContent = optionLabels[option] || option;
      button.onclick = () => onChange(option);
      row.appendChild(button);
    });
    field.appendChild(row);
    return field;
  }

  function labeledNumber(label, value, onChange) {
    const field = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'label';
    title.textContent = label;
    const input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.oninput = (event) => onChange(event.target.value);
    field.appendChild(title);
    field.appendChild(input);
    return field;
  }

  function onCalculate() {
    const result = calculateTax({
      age_category: state.age_category,
      gross_income: state.gross_income,
      other_income: state.other_income,
      deductions: state.deductions
    });
    renderResults(result);
  }

  function getSlabInfo(ageCategory) {
    const oldNil = ageCategory === '80plus' ? 500000 : ageCategory === '60to79' ? 300000 : 250000;
    return {
      old: [
        { label: `Up to ₹${formatNumber(oldNil)}`, rate: '0%' },
        { label: `₹${formatNumber(oldNil + 1)} - ₹500,000`, rate: '5%' },
        { label: '₹500,001 - ₹10,00,000', rate: '20%' },
        { label: 'Above ₹10,00,000', rate: '30%' }
      ],
      new: [
        { label: 'Up to ₹4,00,000', rate: '0%' },
        { label: '₹4,00,001 - ₹8,00,000', rate: '5%' },
        { label: '₹8,00,001 - ₹12,00,000', rate: '10%' },
        { label: '₹12,00,001 - ₹16,00,000', rate: '15%' },
        { label: '₹16,00,001 - ₹20,00,000', rate: '20%' },
        { label: '₹20,00,001 - ₹24,00,000', rate: '25%' },
        { label: 'Above ₹24,00,000', rate: '30%' }
      ]
    };
  }

  function createSlabTable(title, slabs) {
    const box = document.createElement('div');
    box.className = 'slab-box';
    box.innerHTML = `<h4>${title}</h4>`;
    const table = document.createElement('table');
    table.className = 'slab-table';
    table.innerHTML = '<thead><tr><th>Income band</th><th>Rate</th></tr></thead>';
    const tbody = document.createElement('tbody');
    slabs.forEach((slab) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${slab.label}</td><td>${slab.rate}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);
    return box;
  }

  function createHeadroomModal(headroom) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `
      <div class="modal-card">
        <button class="modal-close" type="button">×</button>
        <div class="modal-header">
          <p class="eyebrow">Headroom details</p>
          <h3>Ways to save more next year</h3>
        </div>
        <div class="modal-body"></div>
      </div>
    `;
    const body = overlay.querySelector('.modal-body');
    const list = document.createElement('ul');
    list.className = 'headroom-list';
    Object.keys(headroom).forEach((key) => {
      const item = headroom[key];
      const li = document.createElement('li');
      if (item.used === 0) {
        li.textContent = `${key}: not used yet, headroom ₹${formatNumber(item.cap)}.`;
      } else if (item.remaining > 0) {
        li.textContent = `${key}: ₹${formatNumber(item.remaining)} remaining of ₹${formatNumber(item.cap)} cap.`;
      } else {
        li.textContent = `${key}: fully utilized at cap ₹${formatNumber(item.cap)}.`;
      }
      list.appendChild(li);
    });
    body.appendChild(list);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.classList.add('hidden'));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.classList.add('hidden');
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function renderResults(result) {
    const headroom = computeHeadroom ? computeHeadroom(state.deductions, state.age_category) : null;
    resultsEl.classList.remove('hidden');
    resultsContent.innerHTML = '';
    dashboardGrid.classList.add('results-hidden');
    stepPill.classList.add('hidden');
    wizardTitle.textContent = 'Results';
    backBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');

    const takeHomeOld = Math.max(0, result.old_regime.gross_total_income - result.old_regime.final_tax_payable);
    const takeHomeNew = Math.max(0, result.new_regime.gross_total_income - result.new_regime.final_tax_payable);

    const monthlyOld = Math.round(takeHomeOld / 12);
    const monthlyNew = Math.round(takeHomeNew / 12);

    const summaryCard = document.createElement('div');
    summaryCard.className = 'card summary-card';
    summaryCard.innerHTML = `
      <div class="summary-grid">
        <div>
          <p class="eyebrow">Recommended</p>
          <h3>${result.recommended === 'either' ? 'Both regimes are equal' : `Choose ${result.recommended === 'new' ? 'New' : 'Old'} Regime`}</h3>
          <p class="muted-text">${result.recommended === 'either' ? 'No tax savings difference' : `Estimated savings ₹${formatNumber(result.savings_amount)}`}</p>
        </div>
        <div class="summary-card-metric">
          <span class="eyebrow">Gross total income</span>
          <strong>₹${formatNumber(result.old_regime.gross_total_income)}</strong>
        </div>
        <div class="summary-card-metric">
          <span class="eyebrow">Take home (Old)</span>
          <strong>₹${formatNumber(takeHomeOld)}</strong>
          <p class="summary-caption">₹${formatNumber(monthlyOld)} / month</p>
        </div>
        <div class="summary-card-metric">
          <span class="eyebrow">Take home (New)</span>
          <strong>₹${formatNumber(takeHomeNew)}</strong>
          <p class="summary-caption">₹${formatNumber(monthlyNew)} / month</p>
        </div>
      </div>
    `;
    resultsContent.appendChild(summaryCard);

    const tableCard = document.createElement('div');
    tableCard.className = 'card';
    const table = document.createElement('table');
    table.className = 'result-table';
    table.innerHTML = `<thead><tr><th></th><th>Old Regime</th><th>New Regime</th></tr></thead>`;
    const rows = [
      ['Gross Total Income', result.old_regime.gross_total_income, result.new_regime.gross_total_income],
      ['Total Deductions', result.old_regime.total_deductions, result.new_regime.total_deductions],
      ['Taxable Income', result.old_regime.taxable_income, result.new_regime.taxable_income],
      ['Tax before rebate', result.old_regime.tax_before_rebate, result.new_regime.tax_before_rebate],
      ['Rebate applied', result.old_regime.rebate_applied || 0, result.new_regime.rebate_applied || 0],
      ['Surcharge', result.old_regime.surcharge, result.new_regime.surcharge],
      ['Cess (4%)', result.old_regime.cess, result.new_regime.cess],
      ['Total Tax Payable', result.old_regime.final_tax_payable, result.new_regime.final_tax_payable]
    ];
    const tbody = document.createElement('tbody');
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row[0]}</td><td>₹${formatNumber(row[1])}</td><td>₹${formatNumber(row[2])}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableCard.appendChild(table);
    resultsContent.appendChild(tableCard);

    const slabInfo = getSlabInfo(state.age_category);
    const infoGrid = document.createElement('div');
    infoGrid.className = 'info-grid';
    const slabCard = document.createElement('div');
    slabCard.className = 'card slab-card';
    slabCard.innerHTML = '<div class="slab-grid"></div>';
    const slabGrid = slabCard.querySelector('.slab-grid');
    slabGrid.appendChild(createSlabTable('Old Regime - slabs', slabInfo.old));
    slabGrid.appendChild(createSlabTable('New Regime - slabs', slabInfo.new));

    const headroomMessages = Object.keys(headroom).map((key) => {
      const item = headroom[key];
      if (item.used === 0) {
        return `${key}: unused headroom ₹${formatNumber(item.cap)}`;
      }
      if (item.remaining > 0) {
        return `${key}: ₹${formatNumber(item.remaining)} left`;
      }
      return `${key}: fully utilized`;
    });
    const summaryText = headroomMessages.length > 0 ? headroomMessages.join(' · ') : 'No headroom data available.';

    const actionCard = document.createElement('div');
    actionCard.className = 'card action-card';
    actionCard.innerHTML = `
      <div class="action-row">
        <div>
          <p class="eyebrow">Headroom</p>
          <h4>Ways to save more next year</h4>
          <p class="muted-text">${summaryText}</p>
        </div>
        <button class="btn secondary" id="headroomButton">View headroom details</button>
      </div>
    `;

    infoGrid.appendChild(slabCard);
    infoGrid.appendChild(actionCard);
    resultsContent.appendChild(infoGrid);

    const modal = createHeadroomModal(headroom);
    actionCard.querySelector('#headroomButton').addEventListener('click', () => modal.classList.remove('hidden'));
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('en-IN', {maximumFractionDigits: 0});
  }

  renderStep();
})();
