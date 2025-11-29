document.addEventListener('DOMContentLoaded', () => {
  const productsEl = document.getElementById('products');
  const cartCountEl = document.getElementById('cart-count');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const closeCartBtn = document.getElementById('close-cart');
  let products = [];
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  // migrate older cart entries that may not have a `key` and `shade`
  cart = cart.map(i => {
    if (i.key) return i;
    const shade = i.shade || '';
    const id = i.id || i.productId || '';
    return { ...i, key: `${id}|${shade}`, shade, id };
  });
  localStorage.setItem('cart', JSON.stringify(cart));

  const formatPrice = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value);

  const updateCartCount = () => {
    const count = cart.reduce((s,i) => s + i.qty, 0);
    cartCountEl.textContent = count;
  };

  const renderProducts = () => {
    productsEl.innerHTML = '';
    products.forEach(p => {
      const el = document.createElement('article');
      el.className = 'product-card';
      el.innerHTML = `
        <div class="content">
          <div class="product-title">${p.name}</div>
          <div class="price">${formatPrice(p.price)}</div>
          <div class="product-desc">${p.description}</div>
          <div class="shades">${(p.shades || []).map(s=>`<button class='shade shade-option' data-id='${p.id}' data-shade='${s}'>${s}</button>`).join('')}
          ${(!p.shades || p.shades.length===0) ? `<span class='shade'>Standard</span>` : ''}</div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-primary add-cart" data-id="${p.id}">Add to cart</button>
            <button class="btn btn-secondary view-details" data-id="${p.id}">View</button>
          </div>
        </div>`;

      productsEl.appendChild(el);
    });
  };

  const renderArtists = (artists) => {
    const container = document.getElementById('artists-list');
    container.innerHTML = '';
    artists.forEach(a => {
      const el = document.createElement('div');
      el.className = 'artist-card';
      el.innerHTML = `<img src='${a.image}' alt='${a.name}' /><div><strong>${a.name}</strong><div style='color:#666'>${a.role}</div><div style='font-size:0.95rem;color:#444'>${a.bio}</div></div>`;
      container.appendChild(el);
    });
  };

  const init = async () => {
    // fetch products
    try {
      const res = await fetch('/api/products');
      products = await res.json();
      renderProducts();
      bindProductButtons();
    } catch (err) { console.error(err); }

    try {
      const res2 = await fetch('/api/artists');
      const artists = await res2.json();
      renderArtists(artists);
    } catch (err) { console.error(err) }

    updateCartCount();
    renderCart();
  };

  const bindProductButtons = () => {
    document.querySelectorAll('.add-cart').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.getAttribute('data-id');
        addToCart(id);
      });
    });
    document.querySelectorAll('.view-details').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.getAttribute('data-id');
        const p = products.find(x=>x.id===id);
        if (p) alert(`${p.name}\n\n${formatPrice(p.price)}\n\n${p.description}\n\nShades: ${(p.shades||[]).join(', ')}`)
      });
    });

    // bind shade click events
    document.querySelectorAll('.shade-option').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = btn.getAttribute('data-id');
        // clear selected on same product
        document.querySelectorAll(`.shade-option[data-id="${id}"]`).forEach(s => s.classList.remove('selected'));
        btn.classList.add('selected');
      });
      // auto-select the first shade for the product
      const id = btn.getAttribute('data-id');
      const existsSelected = document.querySelector(`.shade-option[data-id="${id}"].selected`);
      if (!existsSelected) {
        // make the first shade selected only if this is the first in the list
        const parent = btn.parentElement;
        if (parent && parent.querySelector('.shade-option') === btn) btn.classList.add('selected');
      }
    });
  };

  const addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    // determine selected shade
    const selectedShadeEl = document.querySelector(`.shade-option[data-id='${id}'].selected`);
    const shade = selectedShadeEl ? selectedShadeEl.getAttribute('data-shade') : (product.shades && product.shades.length ? product.shades[0] : 'Standard');
    const key = `${id}|${shade}`;
    const existing = cart.find(i => i.key === key);
    if (existing) existing.qty += 1; else cart.push({ key, id, shade, qty:1, price: product.price, name: product.name, image: product.image });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
    cartDrawer.classList.add('open');
  };

  const removeFromCart = (key) => {
    cart = cart.filter(i => i.key !== key);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
  };

  const changeQty = (key, delta) => {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) item.qty = 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
  };

  const renderCart = () => {
    cartItemsEl.innerHTML = '';
    let total = 0;
    cart.forEach(i => {
      total += i.price * i.qty;
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div style='flex:1'>
          <strong>${i.name}</strong>
          <div style='color:#777'>${i.qty} x ${formatPrice(i.price)}${i.shade ? ' • ' + i.shade : ''}</div>
        </div>
        <div style='display:flex;gap:6px;align-items:center'>
          <button class='btn' onclick="window.app.changeQty('${i.key}', -1)">-</button>
          <button class='btn' onclick="window.app.changeQty('${i.key}', 1)">+</button>
          <button class='btn' onclick="window.app.removeFromCart('${i.key}')">Remove</button>
        </div>
      `;
      cartItemsEl.appendChild(el);
    });
    cartTotalEl.textContent = formatPrice(total);
  };

  // Wire up buttons
  document.getElementById('cart-button').addEventListener('click', () => cartDrawer.classList.add('open'));
  closeCartBtn.addEventListener('click', () => cartDrawer.classList.remove('open'));

  checkoutBtn.addEventListener('click', async () => {
    if (!cart.length) { alert('Your cart is empty.'); return; }
    try {
      const res = await fetch('/api/checkout', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ cart, customer: { name:'Guest' } }) });
      const data = await res.json();
      if (data.success) {
        alert(`Order placed! Order ID: ${data.orderId}`);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
        cartDrawer.classList.remove('open');
      } else alert('Checkout failed');
    } catch (err) {
      console.error(err); alert('Error during checkout');
    }
  });

  // Expose functions for inline onclicks
  window.app = {
    changeQty: (key, delta) => changeQty(key, delta),
    removeFromCart: (key) => removeFromCart(key)
  };

  init();
});
