const API_BASE = 'https://butonverse.store/api';

function getTelegramUser() {
  try {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  } catch {
    return null;
  }
}

const params = new URLSearchParams(location.search);
const shopId = params.get('shop');

const allShops = document.getElementById('allShops');
const shopView = document.getElementById('shopView');
const shopsGrid = document.getElementById('shopsGrid');
const productsGrid = document.getElementById('productsGrid');

/* ===== ВСЕ МАГАЗИНЫ ===== */
async function renderAllShops() {
  try {
    const res = await fetch(`${API_BASE}/shops`);
    const data = await res.json();
    
    shopsGrid.innerHTML = data.shops.map(s => `
      <div class="card">
        <img src="${s.avatar_url || 'Image/shopicon.png'}" alt="${s.name}">
        <div class="cardBody">
          <div class="name">${s.name}</div>
          <div class="small">${s.city || ''}</div>
          <p>${s.description || ''}</p>
          <div class="actions">
            <a class="btn" href="store.html?shop=${s.id}">Открыть</a>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading shops:', err);
    shopsGrid.innerHTML = '<p class="warn">Не удалось загрузить магазины</p>';
  }
}

/* ===== ВИТРИНА МАГАЗИНА ===== */
async function renderShop() {
  try {
    const shopRes = await fetch(`${API_BASE}/shops/${shopId}`);
    const shop = await shopRes.json();
    
    const bouquetsRes = await fetch(`${API_BASE}/shops/${shopId}/bouquets`);
    const bouquetsData = await bouquetsRes.json();
    
    allShops.style.display = 'none';
    shopView.style.display = 'block';
    
    document.getElementById('shopName').textContent = shop.name || 'Магазин';
    document.getElementById('shopMeta').textContent = shop.city || '';
    document.getElementById('shopAvatar').src = shop.avatar_url || 'Image/shopicon.png';
    
    productsGrid.innerHTML = bouquetsData.bouquets.map(b => `
      <div class="card">
        <img src="${b.images[0] || 'Image/logo.png'}" alt="${b.name}">
        <div class="cardBody">
          <div class="name">${b.name}</div>
          <div class="priceRow">
            ${b.old_price ? `<div class="old">${b.old_price} ₽</div>` : ''}
            <div class="new">${b.price} ₽</div>
          </div>
          ${b.description ? `<p>${b.description}</p>` : ''}
          <div class="actions">
            <button class="btn" onclick="quickOrder('${b.id}')">Заказать</button>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Error loading shop:', err);
    location.href = 'store.html';
  }
}

/* ===== БЫСТРЫЙ ЗАКАЗ ===== */
async function quickOrder(bouquetId) {
  const tgUser = getTelegramUser();
  
  if (!tgUser) {
    alert('Для заказа необходимо войти через Telegram');
    location.href = 'profile.html';
    return;
  }
  
  const name = prompt('Ваше имя:');
  const phone = prompt('Ваш телефон:');
  const comment = prompt('Комментарий к заказу (опционально):');
  
  if (!name || !phone) {
    alert('Имя и телефон обязательны');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/orders?telegram_id=${tgUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bouquet_id: bouquetId,
        customer_name: name,
        customer_phone: phone,
        comment: comment || null,
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert('Заказ успешно создан!');
      location.href = 'profile.html';
    } else {
      alert('Ошибка: ' + (data.detail || 'Неизвестная ошибка'));
    }
  } catch (err) {
    console.error('Order error:', err);
    alert('Не удалось создать заказ');
  }
}

/* ===== INIT ===== */
if (shopId) {
  renderShop();
} else {
  renderAllShops();
}
