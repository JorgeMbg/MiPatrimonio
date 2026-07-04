// --- ESTADO INICIAL Y DATOS ---
let assets = [];
let snapshots = [];
let darkMode = false; // Estado del modo oscuro
let userPin = localStorage.getItem('app_pin');
if (userPin === 'null') userPin = null; 
let currentPinInput = '';

// --- INICIAR APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  // Limpieza inicial: por seguridad, forzamos que no aparezca nada si no hay pin
  document.getElementById('pin-lock-screen').style.display = 'none';

  // Inicialización de seguridad: solo bloqueamos si el pin existe en localStorage
  // Aseguramos que si no hay pin o es 'null' como string, no bloquee
  const pin = localStorage.getItem('app_pin');
  if (pin && pin !== 'null' && pin !== '' && pin !== null) {
    document.getElementById('pin-lock-screen').style.display = 'flex';
  }
  updatePinStatus();

  // Cargar activos de localStorage
  const savedAssets = localStorage.getItem('net_worth_assets_v1');
  if (savedAssets) {
    try {
      assets = JSON.parse(savedAssets);
      // Migrar activos que no tengan fecha
      let migrated = false;
      assets = assets.map(asset => {
        if (!asset.date) {
          asset.date = getTodayDateString();
          migrated = true;
        }
        return asset;
      });
      if (migrated) saveToLocalStorage();
    } catch (e) {
      assets = [];
    }
  }

  // Cargar snapshots de localStorage
  const savedSnapshots = localStorage.getItem('net_worth_snapshots_v1');
  if (savedSnapshots) {
    try {
      snapshots = JSON.parse(savedSnapshots);
    } catch (e) {
      snapshots = [];
    }
  }

  // Cargar preferencia de modo oscuro
  const savedDarkMode = localStorage.getItem('dark_mode_enabled');
  if (savedDarkMode !== null) {
    darkMode = JSON.parse(savedDarkMode);
  }

  applyDarkMode(); // Aplicar el modo oscuro al cargar
  renderApp();
  renderSnapshots();

  // Event listener para el toggle de modo oscuro
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.checked = darkMode;
    darkModeToggle.addEventListener('change', toggleDarkMode);
  }

  // Event listener para el toggle de modo discreto
  const discreetModeToggle = document.getElementById('discreet-mode-toggle');
  if (discreetModeToggle) {
    discreetModeToggle.checked = localStorage.getItem('discreet_mode_enabled') === 'true';
    discreetModeToggle.addEventListener('change', (e) => {
      localStorage.setItem('discreet_mode_enabled', e.target.checked);
      renderApp();
    });
  }
});

function saveToLocalStorage() {
  localStorage.setItem('net_worth_assets_v1', JSON.stringify(assets));
}

function saveSnapshotsToLocalStorage() {
  localStorage.setItem('net_worth_snapshots_v1', JSON.stringify(snapshots));
}

// --- GESTIÓN DE DATOS (EXPORTAR/IMPORTAR) ---
function exportData() {
  const data = {
    assets: assets,
    snapshots: snapshots,
    version: '1.1' // Actualizada a 1.1 para incluir datos de rentabilidad
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `patrimonio_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.assets && data.snapshots) {
        assets = data.assets;
        snapshots = data.snapshots;
        saveToLocalStorage();
        saveSnapshotsToLocalStorage();
        
        renderApp();
        renderSnapshots();
        alert('Datos importados correctamente.');
      } else {
        alert('Formato de archivo no válido.');
      }
    } catch (err) {
      alert('Error al importar el archivo.');
    }
  };
  reader.readAsText(file);
}


// --- FUNCIONALIDAD MODO OSCURO ---
function applyDarkMode() {
  if (darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('dark_mode_enabled', JSON.stringify(darkMode));
  applyDarkMode();
}

// --- FUNCIONALIDAD DE AJUSTES ---
function updatePinStatus() {
  const el = document.getElementById('pin-status-text');
  if (el) el.textContent = userPin ? 'Activado' : 'Desactivado';
}

function openPinSetup() {
  if (userPin) {
    if (confirm('¿Quieres desactivar el PIN?')) {
      userPin = null;
      localStorage.removeItem('app_pin');
      updatePinStatus();
    }
  } else {
    const newPin = prompt('Introduce un nuevo PIN de 4 dígitos:');
    if (newPin && newPin.length === 4 && /^\d+$/.test(newPin)) {
      userPin = newPin;
      localStorage.setItem('app_pin', newPin);
      updatePinStatus();
      alert('PIN configurado correctamente.');
    } else {
      alert('El PIN debe ser de 4 dígitos numéricos.');
    }
  }
}

function pinInput(digit) {
  if (currentPinInput.length < 4) {
    currentPinInput += digit;
    const dots = document.querySelectorAll('.pin-dot');
    dots[currentPinInput.length - 1].classList.add('filled');
    
    if (currentPinInput.length === 4) {
      if (currentPinInput === userPin) {
        document.getElementById('pin-lock-screen').style.display = 'none';
        currentPinInput = '';
        dots.forEach(d => d.classList.remove('filled'));
      } else {
        alert('PIN incorrecto');
        currentPinInput = '';
        dots.forEach(d => d.classList.remove('filled'));
      }
    }
  }
}

function pinDelete() {
  if (currentPinInput.length > 0) {
    currentPinInput = currentPinInput.slice(0, -1);
    const dots = document.querySelectorAll('.pin-dot');
    dots[currentPinInput.length].classList.remove('filled');
  }
}

function openBackupSubmenu() {
  document.getElementById('view-ajustes').style.display = 'none';
  document.getElementById('view-backup-menu').style.display = 'block';
}

function closeBackupSubmenu() {
  document.getElementById('view-backup-menu').style.display = 'none';
  document.getElementById('view-ajustes').style.display = 'block';
}

// --- NAVEGACIÓN ---
function switchView(view) {
  const resumenView = document.getElementById('view-resumen');
  const historicoView = document.getElementById('view-historico');
  const ajustesView = document.getElementById('view-ajustes'); // Nueva vista de ajustes
  const backupMenu = document.getElementById('view-backup-menu'); // Menú de copia de seguridad

  const tabResumen = document.getElementById('tab-resumen');
  const tabHistorico = document.getElementById('tab-historico');
  const tabAjustes = document.getElementById('tab-ajustes'); // Nuevo tab de ajustes

  // Ocultar todas las vistas y remover la clase 'active' de todos los tabs
  resumenView.style.display = 'none';
  historicoView.style.display = 'none';
  ajustesView.style.display = 'none'; // Ocultar vista de ajustes
  backupMenu.style.display = 'none'; // Asegurar que el submenú se cierre

  tabResumen.classList.remove('active');
  tabHistorico.classList.remove('active');
  tabAjustes.classList.remove('active'); // Remover active de tab de ajustes

  // Mostrar la vista seleccionada y añadir la clase 'active' al tab correspondiente
  if (view === 'resumen') {
    resumenView.style.display = 'block';
    tabResumen.classList.add('active');
    renderApp(); // Asegurarse de que los datos del resumen estén actualizados
  } else if (view === 'historico') {
    historicoView.style.display = 'block';
    tabHistorico.classList.add('active');
    renderSnapshots(); // Asegurarse de que los snapshots estén actualizados
  } else if (view === 'ajustes') {
    ajustesView.style.display = 'block';
    tabAjustes.classList.add('active');
    // Sincronizar el toggle de modo oscuro con el estado actual
    document.getElementById('dark-mode-toggle').checked = darkMode;
  }
}

// --- FECHAS HELPER ---
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}

// --- FORMATEO DE MONEDA ---
function formatCurrency(value) {
  const isDiscreet = localStorage.getItem('discreet_mode_enabled') === 'true';
  if (isDiscreet) return '******';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatCurrencyValueOnly(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value) + ' €';
}

// --- SUBTITLES HELPER ---
function getAssetSubtitle(asset) {
  const nameLower = asset.name.toLowerCase();
  if (asset.category === 'cuentas') {
    if (nameLower.includes('efectivo') || nameLower.includes('cartera')) return 'Cartera física';
    return 'Cuenta corriente';
  }
  if (asset.category === 'inversiones') {
    if (nameLower.includes('etf') || nameLower.includes('world') || nameLower.includes('fondo')) return 'Fondo de Inversión';
    if (nameLower.includes('crypto') || nameLower.includes('btc') || nameLower.includes('bitcoin')) return 'Criptomonedas';
    return 'Acciones / ETFs';
  }
  if (asset.category === 'otros') {
    if (nameLower.includes('casa') || nameLower.includes('vivienda') || nameLower.includes('piso')) return 'Propiedad Inmobiliaria';
    if (nameLower.includes('coche') || nameLower.includes('vehiculo')) return 'Tasación de Vehículo';
    return 'Otros Activos';
  }
  return 'Activo financiero';
}

// --- CONTROLES DINÁMICOS DE INVERSIONES ---
function toggleInversionesFields(mode) {
  const category = document.getElementById(`${mode}-category`).value;
  const invFieldsContainer = document.getElementById(`${mode}-inversiones-fields`);
  const costContainer = document.getElementById(`${mode}-original-cost`).parentElement;
  
  if (category === 'inversiones') {
    invFieldsContainer.style.display = 'block';
    costContainer.style.display = 'block';
  } else if (category === 'cuentas') {
    invFieldsContainer.style.display = 'none';
    costContainer.style.display = 'none';
    document.getElementById(`${mode}-original-cost`).value = '';
    document.getElementById(`${mode}-shares`).value = '';
    document.getElementById(`${mode}-unit-price`).value = '';
  } else {
    invFieldsContainer.style.display = 'none';
    costContainer.style.display = 'block';
    document.getElementById(`${mode}-shares`).value = '';
    document.getElementById(`${mode}-unit-price`).value = '';
  }
}

function calculateTotalValue(mode) {
  const shares = parseFloat(document.getElementById(`${mode}-shares`).value);
  const unitPrice = parseFloat(document.getElementById(`${mode}-unit-price`).value);
  
  if (!isNaN(shares) && !isNaN(unitPrice)) {
    const total = shares * unitPrice;
    document.getElementById(`${mode}-value`).value = total.toFixed(2);
  }
}

// --- RENDERIZADO PRINCIPAL ---
function renderApp() {
  const cuentas = assets.filter(a => a.category === 'cuentas');
  const inversiones = assets.filter(a => a.category === 'inversiones');
  const otros = assets.filter(a => a.category === 'otros');

  const totalCuentas = cuentas.reduce((sum, a) => sum + a.value, 0);
  const totalInversiones = inversiones.reduce((sum, a) => sum + a.value, 0);
  const totalOtros = otros.reduce((sum, a) => sum + a.value, 0);
  const totalNetWorth = totalCuentas + totalInversiones + totalOtros;

  document.getElementById('total-net-worth').textContent = formatCurrency(totalNetWorth);
  document.getElementById('total-cuentas-header').textContent = formatCurrency(totalCuentas);
  document.getElementById('total-inversiones-header').textContent = formatCurrency(totalInversiones);
  document.getElementById('total-otros-header').textContent = formatCurrency(totalOtros);

  const pctCuentas = totalNetWorth > 0 ? (totalCuentas / totalNetWorth) * 100 : 0;
  const pctInversiones = totalNetWorth > 0 ? (totalInversiones / totalNetWorth) * 100 : 0;
  const pctOtros = totalNetWorth > 0 ? (totalOtros / totalNetWorth) * 100 : 0;

  document.getElementById('bar-cuentas').style.width = `${pctCuentas}%`;
  document.getElementById('bar-inversiones').style.width = `${pctInversiones}%`;
  document.getElementById('bar-otros').style.width = `${pctOtros}%`;

  document.getElementById('lbl-cuentas-pct').textContent = `${Math.round(pctCuentas)}%`;
  document.getElementById('lbl-inversiones-pct').textContent = `${Math.round(pctInversiones)}%`;
  document.getElementById('lbl-otros-pct').textContent = `${Math.round(pctOtros)}%`;

  renderCategoryList('list-cuentas', cuentas);
  renderCategoryList('list-inversiones', inversiones);
  renderCategoryList('list-otros', otros);
}

function renderCategoryList(containerId, list) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-msg">No hay elementos añadidos</div>';
    return;
  }

  list.forEach(asset => {
    const item = document.createElement('div');
    item.className = 'ios-list-item';
    item.onclick = () => openEditModal(asset.id);
    
    const dateDisplay = asset.date ? formatDateDisplay(asset.date) : formatDateDisplay(getTodayDateString());
    
    let subtitleText = getAssetSubtitle(asset);
    if (asset.category === 'inversiones' && asset.shares && asset.unitPrice) {
      subtitleText += ` (${parseFloat(asset.shares)} ud x ${formatCurrencyValueOnly(asset.unitPrice)})`;
    }
    
    let roiHtml = '';
    if (asset.originalCost !== undefined && asset.originalCost > 0) {
      const diff = asset.value - asset.originalCost;
      const pct = (diff / asset.originalCost) * 100;
      const sign = diff >= 0 ? '+' : '';
      const roiClass = diff >= 0 ? 'roi-positive' : 'roi-negative';
      roiHtml = `<div class="${roiClass}">${sign}${formatCurrencyValueOnly(diff)} (${sign}${pct.toFixed(1)}%)</div>`;
    }
    
    item.innerHTML = `
      <div class="item-left">
        <span class="item-name">${asset.name}</span>
        <span class="item-subtitle">${subtitleText} • ${dateDisplay}</span>
        ${roiHtml}
      </div>
      <div class="item-right">
        <span class="item-value">${formatCurrency(asset.value)}</span>
        <span class="item-action-lbl">Editar</span>
      </div>
    `;
    container.appendChild(item);
  });
}

// --- MODAL: AÑADIR ACTIVO ---
function openAddModal() {
  document.getElementById('add-name').value = '';
  document.getElementById('add-value').value = '';
  document.getElementById('add-category').value = 'cuentas';
  document.getElementById('add-shares').value = '';
  document.getElementById('add-unit-price').value = '';
  document.getElementById('add-date').value = getTodayDateString();
  toggleInversionesFields('add');
  const modal = document.getElementById('add-modal');
  modal.classList.add('active');
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('active');
}

function submitAddAsset() {
  const name = document.getElementById('add-name').value.trim();
  const value = parseFloat(document.getElementById('add-value').value);
  const originalCostInput = document.getElementById('add-original-cost').value;
  const originalCost = (originalCostInput !== '' && parseFloat(originalCostInput) > 0) ? parseFloat(originalCostInput) : undefined;
  const category = document.getElementById('add-category').value;
  const date = document.getElementById('add-date').value || getTodayDateString();

  if (!name || isNaN(value)) {
    alert('Por favor, rellene todos los campos con valores correctos.');
    return;
  }

  const newAsset = { id: Date.now().toString(), name, value, originalCost, category, date };

  if (category === 'inversiones') {
    const sharesVal = document.getElementById('add-shares').value;
    const priceVal = document.getElementById('add-unit-price').value;
    if (sharesVal !== '' && priceVal !== '') {
      newAsset.shares = parseFloat(sharesVal);
      newAsset.unitPrice = parseFloat(priceVal);
    }
  }

  assets.push(newAsset);
  saveToLocalStorage();
  closeAddModal();
  renderApp();
}

// --- MODAL: EDITAR ACTIVO ---
function openEditModal(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;

  document.getElementById('edit-id').value = asset.id;
  document.getElementById('edit-name').value = asset.name;
  document.getElementById('edit-value').value = asset.value;
  document.getElementById('edit-original-cost').value = asset.originalCost || '';
  document.getElementById('edit-category').value = asset.category;
  document.getElementById('edit-date').value = asset.date || getTodayDateString();

  if (asset.category === 'inversiones') {
    document.getElementById('edit-shares').value = asset.shares !== undefined ? asset.shares : '';
    document.getElementById('edit-unit-price').value = asset.unitPrice !== undefined ? asset.unitPrice : '';
  } else {
    document.getElementById('edit-shares').value = '';
    document.getElementById('edit-unit-price').value = '';
  }

  toggleInversionesFields('edit');
  document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
}

function submitEditAsset() {
  const id = document.getElementById('edit-id').value;
  const name = document.getElementById('edit-name').value.trim();
  const value = parseFloat(document.getElementById('edit-value').value);
  const originalCostInput = document.getElementById('edit-original-cost').value;
  const originalCost = (originalCostInput !== '' && parseFloat(originalCostInput) > 0) ? parseFloat(originalCostInput) : undefined;
  const category = document.getElementById('edit-category').value;
  const date = document.getElementById('edit-date').value || getTodayDateString();

  if (!name || isNaN(value)) {
    alert('Por favor, rellene todos los campos con valores correctos.');
    return;
  }

  const index = assets.findIndex(a => a.id === id);
  if (index !== -1) {
    const updatedAsset = { id, name, value, originalCost, category, date };
    if (category === 'inversiones') {
      const sharesVal = document.getElementById('edit-shares').value;
      const priceVal = document.getElementById('edit-unit-price').value;
      if (sharesVal !== '' && priceVal !== '') {
        updatedAsset.shares = parseFloat(sharesVal);
        updatedAsset.unitPrice = parseFloat(priceVal);
      }
    }
    assets[index] = updatedAsset;
    saveToLocalStorage();
  }
  closeEditModal();
  renderApp();
}

function triggerDeleteAsset() {
  const id = document.getElementById('edit-id').value;
  if (confirm('¿Seguro que deseas eliminar este activo de tu patrimonio?')) {
    assets = assets.filter(a => a.id !== id);
    saveToLocalStorage();
    closeEditModal();
    renderApp();
  }
}

// --- HISTÓRICO: SNAPSHOTS ---
function openSnapshotModal() {
  document.getElementById('snapshot-date').value = getTodayDateString();
  document.getElementById('snapshot-modal').classList.add('active');
}

function closeSnapshotModal() {
  document.getElementById('snapshot-modal').classList.remove('active');
}

function submitSnapshot() {
  const date = document.getElementById('snapshot-date').value;
  if (!date) {
    alert('Por favor, selecciona una fecha para el snapshot.');
    return;
  }

  // Capturar estado actual de activos (incluyendo las nuevas propiedades de rentabilidad)
  const snapshotAssets = JSON.parse(JSON.stringify(assets));
  
  // Calcular totales para el snapshot
  const totalCuentas = snapshotAssets.filter(a => a.category === 'cuentas').reduce((sum, a) => sum + a.value, 0);
  const totalInversiones = snapshotAssets.filter(a => a.category === 'inversiones').reduce((sum, a) => sum + a.value, 0);
  const totalOtros = snapshotAssets.filter(a => a.category === 'otros').reduce((sum, a) => sum + a.value, 0);
  const totalValue = totalCuentas + totalInversiones + totalOtros;

  const newSnapshot = {
    id: Date.now().toString(),
    date: date,
    total: totalValue,
    details: {
      cuentas: totalCuentas,
      inversiones: totalInversiones,
      otros: totalOtros
    },
    assets: snapshotAssets
  };

  snapshots.unshift(newSnapshot); // Añadir al principio (más reciente primero)
  // Opcional: ordenar por fecha
  snapshots.sort((a, b) => new Date(b.date) - new Date(a.date));

  saveSnapshotsToLocalStorage();
  closeSnapshotModal();
  renderSnapshots();
}

function renderSnapshots() {
  const container = document.getElementById('snapshot-list');
  container.innerHTML = '';

  if (snapshots.length === 0) {
    container.innerHTML = '<div class="empty-msg">No has guardado ningún snapshot todavía. Pulsa el botón superior para capturar tu estado actual.</div>';
    return;
  }

  snapshots.forEach(snapshot => {
    const card = document.createElement('div');
    card.className = 'snapshot-card';
    card.onclick = (e) => {
      if (e.target.tagName !== 'BUTTON') {
        openSnapshotDetail(snapshot.id);
      }
    };
    
    const totalOriginalCost = snapshot.assets.reduce((sum, a) => sum + (a.originalCost || a.value), 0);
    const totalDiff = snapshot.total - totalOriginalCost;
    const totalPct = totalOriginalCost > 0 ? (totalDiff / totalOriginalCost) * 100 : 0;
    const totalSign = totalDiff >= 0 ? '+' : '';
    const totalRoiClass = totalDiff >= 0 ? 'roi-positive' : 'roi-negative';
    
    card.innerHTML = `
      <div class="snapshot-card-header">
        <div class="snapshot-card-info">
          <span class="snapshot-card-date">${formatDateDisplay(snapshot.date)}</span>
          <span class="snapshot-card-total">${formatCurrency(snapshot.total)}</span>
          <div class="${totalRoiClass}">${totalSign}${formatCurrencyValueOnly(totalDiff)} (${totalSign}${totalPct.toFixed(1)}%)</div>
        </div>
        <button class="delete-snapshot-btn" onclick="deleteSnapshot('${snapshot.id}')">Eliminar</button>
      </div>
      <div class="snapshot-card-details">
        <div class="snapshot-detail-item">
          <span class="detail-label">Cuentas:</span>
          <span class="detail-value">${formatCurrency(snapshot.details.cuentas)}</span>
        </div>
        <div class="snapshot-detail-item">
          <span class="detail-label">Inversión:</span>
          <span class="detail-value">${formatCurrency(snapshot.details.inversiones)}</span>
        </div>
        <div class="snapshot-detail-item">
          <span class="detail-label">Otros:</span>
          <span class="detail-value">${formatCurrency(snapshot.details.otros)}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function deleteSnapshot(id) {
  if (confirm('¿Seguro que quieres eliminar este snapshot?')) {
    snapshots = snapshots.filter(s => s.id !== id);
    saveSnapshotsToLocalStorage();
    renderSnapshots();
  }
}

// --- MODAL: DETALLE DE SNAPSHOT ---
function openSnapshotDetail(id) {
  const snapshot = snapshots.find(s => s.id === id);
  if (!snapshot) return;

  document.getElementById('detail-snapshot-title').textContent = `Snapshot: ${formatDateDisplay(snapshot.date)}`;
  
  const content = document.getElementById('snapshot-detail-content');
  content.innerHTML = '';

  const categories = {
    cuentas: { title: 'Cuentas Bancarias', assets: [] },
    inversiones: { title: 'Inversiones y Bolsa', assets: [] },
    otros: { title: 'Otros Activos', assets: [] }
  };

  snapshot.assets.forEach(asset => {
    if (categories[asset.category]) {
      categories[asset.category].assets.push(asset);
    }
  });

  for (const catKey in categories) {
    const category = categories[catKey];
    if (category.assets.length > 0) {
      const section = document.createElement('div');
      section.className = 'snapshot-detail-section';
      
      let html = `<h4 class="snapshot-detail-category-title">${category.title}</h4>`;
      html += `<div class="ios-list-group">`;
      
      category.assets.forEach(asset => {
        let subtitle = getAssetSubtitle(asset);
        if (asset.category === 'inversiones' && asset.shares && asset.unitPrice) {
          subtitle += ` (${parseFloat(asset.shares)} ud x ${formatCurrencyValueOnly(asset.unitPrice)})`;
        }
        
        let roiHtml = '';
        if (asset.originalCost !== undefined && asset.originalCost > 0) {
          const diff = asset.value - asset.originalCost;
          const pct = (diff / asset.originalCost) * 100;
          const sign = diff >= 0 ? '+' : '';
          const roiClass = diff >= 0 ? 'roi-positive' : 'roi-negative';
          roiHtml = `<div class="${roiClass}" style="font-size: 0.85em; margin-top: 2px;">${sign}${formatCurrencyValueOnly(diff)} (${sign}${pct.toFixed(1)}%)</div>`;
        }
        
        html += `
          <div class="ios-list-item" style="cursor: default; display: flex; flex-direction: column; align-items: flex-start;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <div class="item-left">
                <span class="item-name">${asset.name}</span>
                <span class="item-subtitle">${subtitle}</span>
              </div>
              <div class="item-right">
                <span class="item-value">${formatCurrency(asset.value)}</span>
              </div>
            </div>
            ${roiHtml}
          </div>
        `;
      });
      
      html += `</div>`;
      section.innerHTML = html;
      content.appendChild(section);
    }
  }

  document.getElementById('snapshot-detail-modal').classList.add('active');
}

function closeSnapshotDetailModal() {
  document.getElementById('snapshot-detail-modal').classList.remove('active');
}
