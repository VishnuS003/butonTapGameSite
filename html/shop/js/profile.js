const API_BASE = 'https://butonverse.store/api';

const LS = {
  shopToken: 'fc_shop_token',
};

const gate = document.getElementById('gate');
const playerCab = document.getElementById('playerCab');
const shopCab = document.getElementById('shopCab');

document.getElementById('btnPlayer').onclick = loginPlayer;
document.getElementById('btnShop').onclick = loginShop;

function getTelegramUser() {
  try {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  } catch {
    return null;
  }
}

async function loginPlayer() {
  const tg = getTelegramUser();
  
  if (!tg) {
    alert('Telegram WebApp недоступен. Откройте сайт через Telegram бота.');
    return;
  }
  
  renderPlayerCab(tg);
}

function loginShop() {
  const email = prompt('Email:');
  const password = prompt('Пароль:');
  
  if (!email || !password) return;
  
  const choice = confirm('У вас уже есть аккаунт?\nОК = Да (Вход)\nОтмена = Нет (Регистрация)');
  
  if (choice) {
    shopLogin(email, password);
  } else {
    shopRegister(email, password);
  }
}

async function shopRegister(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/shop/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem(LS.shopToken, data.token);
      renderShopCab(data.shop);
    } else {
      alert('Ошибка регистрации: ' + (data.detail || 'Email уже занят'));
    }
  } catch (err) {
    console.error('Register error:', err);
    alert('Ошибка подключения к серверу');
  }
}

async function shopLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/shop/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem(LS.shopToken, data.token);
      renderShopCab(data.shop);
    } else {
      alert('Ошибка входа: ' + (data.detail || 'Неверный email или пароль'));
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Ошибка подключения к серверу');
  }
}

function logout() {
  localStorage.removeItem(LS.shopToken);
  render();
}

async function render() {
  gate.classList.add('hidden');
  playerCab.classList.add('hidden');
  shopCab.classList.add('hidden');
  
  const tgUser = getTelegramUser();
  const shopToken = localStorage.getItem(LS.shopToken);
  
  if (tgUser) {
    renderPlayerCab(tgUser);
    return;
  }
  
  if (shopToken) {
    try {
      const res = await fetch(`${API_BASE}/me/shop`, {
        headers: { 'Authorization': `Bearer ${shopToken}` },
      });
      
      if (res.ok) {
        const shop = await res.json();
        renderShopCab(shop);
        return;
      } else {
        localStorage.removeItem(LS.shopToken);
      }
    } catch (err) {
      console.error('Token check error:', err);
      localStorage.removeItem(LS.shopToken);
    }
  }
  
  gate.classList.remove('hidden');
}

async function renderPlayerCab(tgUser) {
  try {
    const res = await fetch(`${API_BASE}/me/orders?telegram_id=${tgUser.id}`);
    const data = await res.json();
    
    playerCab.innerHTML = `
      <div class="card">
        <div class="h1">Игрок</div>
        <div class="sub">@${tgUser.username || tgUser.first_name}</div>
        
        <div class="warn center" style="margin: 20px 0;">
          FarmCoin автоматически появится в Вашем кошельке.<br>
          Следите за новостями.
        </div>
        
        <div class="h1" style="margin-top: 30px;">Мои заказы</div>
        <div id="ordersList"></div>
      </div>
    `;
    
    const ordersList = playerCab.querySelector('#ordersList');
    
    if (data.orders.length === 0) {
      ordersList.innerHTML = '<p class="sub">У вас пока нет заказов</p>';
    } else {
      ordersList.innerHTML = data.orders.map(o => `
        <div class="card" style="margin: 10px 0; padding: 15px; background: rgba(255,255,255,0.05);">
          <div class="name">${o.shop_name} — ${o.bouquet_name}</div>
          <div class="small">${new Date(o.created_at).toLocaleDateString()}</div>
          <div class="priceRow"><div class="new">${o.price} ₽</div></div>
          <div class="warn">${o.status}</div>
        </div>
      `).join('');
    }
    
    playerCab.classList.remove('hidden');
  } catch (err) {
    console.error('Player cab error:', err);
    playerCab.innerHTML = '<div class="card warn">Ошибка загрузки профиля</div>';
    playerCab.classList.remove('hidden');
  }
}

async function renderShopCab(shop) {
  const token = localStorage.getItem(LS.shopToken);
  
  try {
    const bouquetsRes = await fetch(`${API_BASE}/me/bouquets`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const bouquetsData = await bouquetsRes.json();
    
    const ordersRes = await fetch(`${API_BASE}/me/shop/orders`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const ordersData = await ordersRes.json();
    
    shopCab.innerHTML = `
      <div class="card">
        <div class="h1">Магазин</div>
        <div class="sub">${shop.email}</div>
        
        <div style="margin: 20px 0;">
          <button class="btn" onclick="editProfile()">Редактировать профиль</button>
        </div>
        
        <div class="info">
          <p><strong>Название:</strong> ${shop.name || 'Не указано'}</p>
          <p><strong>Город:</strong> ${shop.city || 'Не указан'}</p>
          <p><strong>Описание:</strong> ${shop.description || 'Не указано'}</p>
          <p><strong>Телефон:</strong> ${shop.phone || 'Не указан'}</p>
        </div>
        
        <div class="h1" style="margin-top: 30px;">
          Мои букеты
          <button class="btn primary" onclick="addBouquet()" style="margin-left: 10px;">+ Добавить</button>
        </div>
        <div id="bouquetsList"></div>
        
        <div class="h1" style="margin-top: 30px;">Заказы</div>
        <div id="ordersList"></div>
        
        <div class="center" style="margin-top: 30px;">
          <button class="btn" onclick="logout()">Выйти</button>
        </div>
      </div>
    `;
    
    const bouquetsList = shopCab.querySelector('#bouquetsList');
    if (bouquetsData.bouquets.length === 0) {
      bouquetsList.innerHTML = '<p class="sub">У вас пока нет букетов</p>';
    } else {
      bouquetsList.innerHTML = bouquetsData.bouquets.map(b => `
        <div class="card" style="margin: 10px 0; padding: 15px; background: rgba(255,255,255,0.05);">
          <div class="name">${b.name}</div>
          <div class="priceRow">
            ${b.old_price ? `<div class="old">${b.old_price} ₽</div>` : ''}
            <div class="new">${b.price} ₽</div>
          </div>
          <div class="small">${b.status}</div>
        </div>
      `).join('');
    }
    
    const ordersList = shopCab.querySelector('#ordersList');
    if (ordersData.orders.length === 0) {
      ordersList.innerHTML = '<p class="sub">Заказов пока нет</p>';
    } else {
      ordersList.innerHTML = ordersData.orders.map(o => `
        <div class="card" style="margin: 10px 0; padding: 15px; background: rgba(255,255,255,0.05);">
          <div class="name">${o.bouquet_name}</div>
          <p><strong>Клиент:</strong> ${o.customer_name || 'Не указан'}</p>
          <p><strong>Телефон:</strong> ${o.customer_phone || 'Не указан'}</p>
          <p><strong>Комментарий:</strong> ${o.comment || 'Нет'}</p>
          <div class="priceRow"><div class="new">${o.price} ₽</div></div>
          <div class="warn">${o.status} — ${new Date(o.created_at).toLocaleDateString()}</div>
        </div>
      `).join('');
    }
    
    shopCab.classList.remove('hidden');
  } catch (err) {
    console.error('Shop cab error:', err);
    shopCab.innerHTML = '<div class="card warn">Ошибка загрузки данных</div>';
    shopCab.classList.remove('hidden');
  }
}

async function editProfile() {
  const token = localStorage.getItem(LS.shopToken);
  
  const name = prompt('Название магазина:');
  const city = prompt('Город:');
  const description = prompt('Описание:');
  const phone = prompt('Телефон:');
  const avatar_url = prompt('URL аватара (опционально):');
  
  try {
    const res = await fetch(`${API_BASE}/me/shop`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        city,
        description,
        phone,
        avatar_url: avatar_url || null,
      }),
    });
    
    if (res.ok) {
      alert('Профиль обновлен!');
      render();
    } else {
      alert('Ошибка обновления');
    }
  } catch (err) {
    console.error('Update error:', err);
    alert('Ошибка подключения');
  }
}

async function addBouquet() {
  const token = localStorage.getItem(LS.shopToken);
  
  const name = prompt('Название букета:');
  const price = parseFloat(prompt('Цена:'));
  const old_price = prompt('Старая цена (опционально, для скидки):');
  const description = prompt('Описание (опционально):');
  
  const urls = [];
  for (let i = 1; i <= 5; i++) {
    const url = prompt(`URL фото ${i} (мин 1, макс 5):`);
    if (!url) break;
    urls.push(url);
  }
  
  if (!name || !price || urls.length === 0) {
    alert('Название, цена и хотя бы 1 фото обязательны');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/me/bouquets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        price,
        old_price: old_price ? parseFloat(old_price) : null,
        description: description || null,
        image_urls: urls,
      }),
    });
    
    if (res.ok) {
      alert('Букет добавлен!');
      render();
    } else {
      const data = await res.json();
      alert('Ошибка: ' + (data.detail || 'Неизвестная ошибка'));
    }
  } catch (err) {
    console.error('Add bouquet error:', err);
    alert('Ошибка подключения');
  }
}

render();
