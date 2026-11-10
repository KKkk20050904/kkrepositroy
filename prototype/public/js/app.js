(function () {
  'use strict';

  const catalog = window.PDD_CATALOG || {
    categories: [],
    products: [],
    hotSearches: []
  };

  const page = document.body.dataset.page;
  const ICON_SPRITE = 'images/icons.svg';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const icon = (name, className = 'icon') =>
    `<svg class="${className}" aria-hidden="true"><use href="${ICON_SPRITE}#${name}"></use></svg>`;

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[character];
    });

  const formatPrice = (value) => {
    const number = Number(value);
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
  };

  const discountText = (product) => {
    const discount = (product.price / product.originalPrice) * 10;
    return `${discount.toFixed(1)}折`;
  };

  const categoryName = (id) => {
    const category = catalog.categories.find((item) => item.id === id);
    return category ? category.name : '';
  };

  const productById = (id) => catalog.products.find((product) => product.id === id);

  const CHILD_ICON_RULES = [
    ['水果', '🍊'],
    ['蔬菜', '🥬'],
    ['肉禽', '🥩'],
    ['海鲜', '🦐'],
    ['粮油', '🌾'],
    ['乳品', '🥛'],
    ['手机', '📱'],
    ['智能', '⌚'],
    ['耳机', '🎧'],
    ['电脑', '💻'],
    ['摄影', '📷'],
    ['数码', '🔋'],
    ['连衣裙', '👗'],
    ['T恤', '👕'],
    ['牛仔', '👖'],
    ['外套', '🧥'],
    ['卫衣', '🧥'],
    ['内衣', '🧦'],
    ['护肤', '🧴'],
    ['彩妆', '💄'],
    ['洗发', '🧴'],
    ['身体', '🫧'],
    ['口腔', '🪥'],
    ['美妆', '🪞'],
    ['纸尿裤', '👶'],
    ['奶粉', '🍼'],
    ['童装', '🧒'],
    ['玩具', '🧸'],
    ['洗护', '🛁'],
    ['孕产', '🤰'],
    ['零食', '🍿'],
    ['坚果', '🥜'],
    ['饮料', '🥤'],
    ['速食', '🍜'],
    ['糖果', '🍫'],
    ['茶叶', '🍵'],
    ['床品', '🛏️'],
    ['收纳', '📦'],
    ['厨房', '🍳'],
    ['清洁', '🧽'],
    ['家装', '🔨'],
    ['灯具', '💡'],
    ['生活电器', '🌀'],
    ['个护电器', '🪒'],
    ['大家电', '📺'],
    ['影音', '🔊'],
    ['电器', '🔌'],
    ['女鞋', '👠'],
    ['男鞋', '👞'],
    ['箱包', '👜'],
    ['饰品', '💍'],
    ['手表', '⌚'],
    ['眼镜', '👓'],
    ['运动', '🏃'],
    ['健身', '🏋️'],
    ['户外', '⛺'],
    ['骑行', '🚴'],
    ['游泳', '🏊'],
    ['球类', '🏀'],
    ['图书', '📖'],
    ['文具', '✏️'],
    ['办公', '📎'],
    ['绘画', '🎨'],
    ['益智', '🧩'],
    ['字帖', '✍️'],
    ['猫粮', '🐱'],
    ['狗粮', '🐶'],
    ['宠物', '🐾'],
    ['出行', '🐾']
  ];

  const childIcon = (name) => {
    const rule = CHILD_ICON_RULES.find(([keyword]) => name.includes(keyword));
    return rule ? rule[1] : '🛍️';
  };

  /* =========================================================
     Shared UI pieces
     ========================================================= */

  function productCard(product) {
    const tags = product.tags
      .slice(0, 2)
      .map((tag) => `<span class="product-tag">${escapeHtml(tag)}</span>`)
      .join('');

    return `
      <article class="product-card" role="button" tabindex="0"
        data-product-id="${escapeHtml(product.id)}"
        aria-label="查看商品：${escapeHtml(product.title)}">
        <div class="product-media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy" width="400" height="400">
          <span class="product-badge">${escapeHtml(product.badge)}</span>
        </div>
        <div class="product-info">
          <h3>${escapeHtml(product.title)}</h3>
          <div class="product-tags">${tags}</div>
          <div class="product-prices">
            <span class="price"><small>¥</small>${formatPrice(product.price)}</span>
            <span class="original">¥${formatPrice(product.originalPrice)}</span>
          </div>
          <div class="product-meta">
            <span>已拼 ${escapeHtml(product.sales)} 件</span>
            <span>${discountText(product)}</span>
          </div>
        </div>
      </article>`;
  }

  let toastTimer = 0;

  function showToast(message) {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  /* =========================================================
     Search overlay
     ========================================================= */

  const searchOverlay = document.createElement('div');
  searchOverlay.className = 'search-overlay';
  searchOverlay.id = 'searchOverlay';
  searchOverlay.setAttribute('aria-hidden', 'true');
  searchOverlay.innerHTML = `
    <div class="search-shell" role="dialog" aria-modal="true" aria-label="搜索商品">
      <div class="search-top">
        <form class="search-form" id="searchForm" role="search">
          ${icon('search')}
          <input id="searchInput" type="search" autocomplete="off" enterkeyhint="search"
            placeholder="搜索商品，如耳机、抽纸" aria-label="搜索商品">
          <button class="search-clear" id="searchClear" type="button" aria-label="清空搜索" hidden>×</button>
        </form>
        <button class="search-cancel" type="button" data-close-search>取消</button>
      </div>
      <div class="search-body" id="searchBody"></div>
    </div>`;
  document.body.appendChild(searchOverlay);

  const searchInput = $('#searchInput', searchOverlay);
  const searchClear = $('#searchClear', searchOverlay);
  const searchBody = $('#searchBody', searchOverlay);
  let searchLastFocus = null;

  function renderSearchHints() {
    const tags = catalog.hotSearches
      .map((term) => `<button class="hot-tag" type="button" data-hot-search="${escapeHtml(term)}">${escapeHtml(term)}</button>`)
      .join('');

    searchBody.innerHTML = `
      <div class="search-block">
        <h3>热门搜索 <span>大家都在搜</span></h3>
        <div class="hot-tags">${tags}</div>
      </div>
      <p class="search-tip">试试搜“耳机”“抽纸”或“苹果”，都有惊喜价</p>`;
    searchClear.hidden = true;
  }

  function renderSearchResults(query) {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);

    const results = catalog.products.filter((product) => {
      const haystack = [
        product.title,
        product.subtitle,
        product.badge,
        ...product.tags,
        categoryName(product.category)
      ]
        .join(' ')
        .toLowerCase()
        .replace(/\s+/g, '');
      return words.every((word) => haystack.includes(word.replace(/\s+/g, '')));
    });

    if (!results.length) {
      searchBody.innerHTML = `
        <div class="search-empty">
          <span class="emoji" aria-hidden="true">🔍</span>
          <b>没有找到“${escapeHtml(query)}”</b>
          <span>换个关键词试试，比如“耳机”或“抽纸”</span>
        </div>`;
      return;
    }

    const rows = results
      .map(
        (product) => `
          <button class="search-result" type="button" data-product-id="${escapeHtml(product.id)}">
            <img src="${escapeHtml(product.image)}" alt="" loading="lazy" width="76" height="76">
            <span class="search-result-info">
              <span class="search-result-title">${escapeHtml(product.title)}</span>
              <span class="search-result-tags">
                <span>${escapeHtml(product.badge)}</span>
                <span>${escapeHtml(product.tags[0] || '退货包运费')}</span>
              </span>
              <span class="price"><small>¥</small>${formatPrice(product.price)}</span>
            </span>
          </button>`
      )
      .join('');

    searchBody.innerHTML = `
      <div class="search-results-head">
        <span>找到 <b>${results.length}</b> 件相关商品</span>
        <span>综合排序</span>
      </div>
      <div class="search-results">${rows}</div>`;
  }

  function openSearch() {
    searchLastFocus = document.activeElement;
    searchOverlay.classList.add('open');
    searchOverlay.setAttribute('aria-hidden', 'false');
    searchInput.value = '';
    renderSearchHints();
    syncScrollLock();
    window.setTimeout(() => searchInput.focus(), 120);
  }

  function closeSearch() {
    searchOverlay.classList.remove('open');
    searchOverlay.setAttribute('aria-hidden', 'true');
    syncScrollLock();
    if (searchLastFocus && typeof searchLastFocus.focus === 'function') {
      searchLastFocus.focus({ preventScroll: true });
    }
  }

  searchOverlay.addEventListener('input', (event) => {
    if (event.target !== searchInput) return;
    const query = searchInput.value.trim();
    searchClear.hidden = !query;
    if (!query) {
      renderSearchHints();
      return;
    }
    renderSearchResults(query);
  });

  searchOverlay.addEventListener('click', (event) => {
    const closeButton = event.target.closest('[data-close-search]');
    if (closeButton) {
      closeSearch();
      return;
    }

    const hotTag = event.target.closest('[data-hot-search]');
    if (hotTag) {
      searchInput.value = hotTag.dataset.hotSearch;
      searchClear.hidden = false;
      renderSearchResults(searchInput.value);
      searchInput.focus();
    }
  });

  searchOverlay.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) renderSearchResults(query);
    searchInput.blur();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    renderSearchHints();
    searchInput.focus();
  });

  /* =========================================================
     Product detail sheet
     ========================================================= */

  const productSheet = document.createElement('div');
  productSheet.className = 'sheet-backdrop';
  productSheet.id = 'productSheet';
  productSheet.innerHTML = `
    <section class="product-sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
      <button class="sheet-close" type="button" data-close-sheet aria-label="关闭商品详情">
        ${icon('close')}
      </button>
      <div class="sheet-product">
        <img id="sheetImage" src="" alt="" width="122" height="122">
        <div class="sheet-info">
          <h2 id="sheetTitle"></h2>
          <p class="sheet-sub" id="sheetSub"></p>
          <div class="sheet-price">
            <span class="price"><small>¥</small><span id="sheetPrice"></span></span>
            <span class="original" id="sheetOriginal"></span>
          </div>
          <div class="sheet-tags" id="sheetTags"></div>
        </div>
      </div>
      <div class="sheet-divider"></div>
      <div class="sheet-benefits">
        <span>${icon('shield')}正品保障</span>
        <span>${icon('check')}极速退款</span>
        <span>${icon('order-receive')}退货包运费</span>
      </div>
      <div class="sheet-actions">
        <button class="btn-outline" type="button" data-sheet-action="cart">加入购物车</button>
        <button class="btn-primary" type="button" data-sheet-action="buy">立即购买</button>
      </div>
    </section>`;
  document.body.appendChild(productSheet);

  let sheetProduct = null;
  let productLastFocus = null;

  function openProduct(productId) {
    const product = productById(productId);
    if (!product) return;

    sheetProduct = product;
    productLastFocus = document.activeElement;

    const image = $('#sheetImage', productSheet);
    image.src = product.image;
    image.alt = product.title;
    $('#sheetTitle', productSheet).textContent = product.title;
    $('#sheetSub', productSheet).textContent = product.subtitle;
    $('#sheetPrice', productSheet).textContent = formatPrice(product.price);
    $('#sheetOriginal', productSheet).textContent = `¥${formatPrice(product.originalPrice)}`;
    $('#sheetTags', productSheet).innerHTML = [
      product.badge,
      ...product.tags,
      `${discountText(product)}`
    ]
      .map((tag) => `<span class="sheet-tag">${escapeHtml(tag)}</span>`)
      .join('');

    productSheet.classList.add('open');
    syncScrollLock();
    window.setTimeout(() => $('[data-close-sheet]', productSheet).focus(), 80);
  }

  function closeProduct() {
    productSheet.classList.remove('open');
    syncScrollLock();
    if (productLastFocus && typeof productLastFocus.focus === 'function') {
      productLastFocus.focus({ preventScroll: true });
    }
  }

  productSheet.addEventListener('click', (event) => {
    if (event.target === productSheet || event.target.closest('[data-close-sheet]')) {
      closeProduct();
      return;
    }

    const action = event.target.closest('[data-sheet-action]');
    if (!action || !sheetProduct) return;

    if (action.dataset.sheetAction === 'cart') {
      showToast(`已加入购物车：${sheetProduct.title}`);
      return;
    }

    if (action.dataset.sheetAction === 'buy') {
      showToast(`演示下单成功：${sheetProduct.title}`);
      closeProduct();
    }
  });

  function syncScrollLock() {
    const shouldLock = searchOverlay.classList.contains('open') || productSheet.classList.contains('open');
    document.body.classList.toggle('no-scroll', shouldLock);
  }

  /* =========================================================
     Global interactions
     ========================================================= */

  document.addEventListener('click', (event) => {
    const searchTrigger = event.target.closest('[data-open-search]');
    if (searchTrigger) {
      event.preventDefault();
      openSearch();
      return;
    }

    const productTrigger = event.target.closest('[data-product-id]');
    if (productTrigger) {
      event.preventDefault();
      openProduct(productTrigger.dataset.productId);
      return;
    }

    const toastTrigger = event.target.closest('[data-toast]');
    if (toastTrigger) {
      event.preventDefault();
      showToast(toastTrigger.dataset.toast);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (productSheet.classList.contains('open')) {
        closeProduct();
        return;
      }
      if (searchOverlay.classList.contains('open')) {
        closeSearch();
      }
      return;
    }

    if (
      (event.key === 'Enter' || event.key === ' ') &&
      event.target.matches('.product-card[data-product-id]')
    ) {
      event.preventDefault();
      openProduct(event.target.dataset.productId);
    }
  });

  /* =========================================================
     Home page
     ========================================================= */

  function renderQuickNav() {
    const container = $('#quickNav');
    if (!container) return;

    const quickItems = catalog.categories.slice(0, 9).map(
      (category) => `
        <a class="quick-item" href="category.html?cat=${encodeURIComponent(category.id)}">
          <span class="quick-icon" style="background:${category.color}">${category.icon}</span>
          <span>${escapeHtml(category.name)}</span>
        </a>`
    );

    quickItems.push(`
      <a class="quick-item" href="category.html">
        <span class="quick-icon" style="background:#f3efed">${icon('grid')}</span>
        <span>全部分类</span>
      </a>`);

    container.innerHTML = quickItems.join('');
  }

  function renderFlash() {
    const container = $('#flashGrid');
    if (!container) return;

    const flashProducts = ['p1', 'p2', 'p8']
      .map(productById)
      .filter(Boolean);

    container.innerHTML = flashProducts
      .map(
        (product) => `
          <a class="flash-item" href="#" data-product-id="${escapeHtml(product.id)}">
            <span class="flash-media">
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy" width="120" height="120">
              <span class="flash-discount">${discountText(product)}</span>
            </span>
            <h3>${escapeHtml(product.title)}</h3>
            <span class="flash-price"><small>¥</small>${formatPrice(product.price)}</span>
            <span class="flash-old">¥${formatPrice(product.originalPrice)}</span>
          </a>`
      )
      .join('');
  }

  function renderFeed() {
    const container = $('#productGrid');
    if (!container) return;
    container.innerHTML = catalog.products.map(productCard).join('');
  }

  function startCountdown() {
    const hourNode = $('#countHour');
    const minuteNode = $('#countMinute');
    const secondNode = $('#countSecond');
    if (!hourNode || !minuteNode || !secondNode) return;

    let remaining = 2 * 60 * 60 + 18 * 60 + 36;

    const tick = () => {
      if (remaining < 0) remaining = 2 * 60 * 60;
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      hourNode.textContent = String(hours).padStart(2, '0');
      minuteNode.textContent = String(minutes).padStart(2, '0');
      secondNode.textContent = String(seconds).padStart(2, '0');
      remaining -= 1;
    };

    tick();
    window.setInterval(tick, 1000);
  }

  function initHome() {
    renderQuickNav();
    renderFlash();
    renderFeed();
    startCountdown();
  }

  /* =========================================================
     Category page
     ========================================================= */

  let categories = [];
  let activeCategoryId = '';

  async function fetchCategories() {
    try {
      const response = await fetch('/api/category', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      const list = Array.isArray(payload.data) ? payload.data : payload.data && payload.data.categories;
      if (!Array.isArray(list) || !list.length) throw new Error('接口返回格式不正确');
      return list;
    } catch (error) {
      console.info('分类接口不可用，已切换到本地数据：', error.message);
      return catalog.categories;
    }
  }

  function getProductsForCategory(category) {
    const ownProducts = catalog.products.filter((product) => product.category === category.id);
    const fillProducts = catalog.products
      .filter((product) => product.category !== category.id)
      .slice(0, Math.max(0, 4 - ownProducts.length));
    return ownProducts.concat(fillProducts).slice(0, 4);
  }

  function renderCategoryContent(category) {
    const content = $('#catContent');
    if (!content) return;

    const products = getProductsForCategory(category);
    const ownProducts = catalog.products.some((product) => product.category === category.id);
    const childTiles = category.children
      .map(
        (child) => `
          <button class="subcat-item" type="button" data-subcat="${escapeHtml(child)}">
            <span class="subcat-icon">${childIcon(child)}</span>
            <span>${escapeHtml(child)}</span>
          </button>`
      )
      .join('');

    content.setAttribute('aria-busy', 'false');
    content.innerHTML = `
      <div class="cat-banner" style="--cat-bg:${category.color}">
        <div class="cat-banner-copy">
          <span class="eyebrow">PINDUODUO SELECT</span>
          <h2>${escapeHtml(category.name)}</h2>
          <p>${escapeHtml(category.blurb)}</p>
          <span class="cat-banner-pill">低至 5 折</span>
        </div>
        <div class="cat-banner-icon" aria-hidden="true">${category.icon}</div>
      </div>

      <div class="cat-section-head">
        <h3>热门分类</h3>
        <span>${category.children.length} 个细分</span>
      </div>
      <div class="subcat-grid">${childTiles}</div>

      <div class="cat-section-head">
        <h3>${ownProducts ? '分类好物' : '大家都在买'}</h3>
        <span>为你精选 ${products.length} 件</span>
      </div>
      <div class="product-grid">${products.map(productCard).join('')}</div>`;
  }

  function selectCategory(categoryId, options = {}) {
    const category = categories.find((item) => item.id === categoryId) || categories[0];
    if (!category) return;

    activeCategoryId = category.id;
    $$('.cat-tab').forEach((tab) => {
      const isActive = tab.dataset.cat === category.id;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    renderCategoryContent(category);

    if (options.updateUrl !== false) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('cat', category.id);
        window.history.replaceState(null, '', url);
      } catch (error) {
        /* file:// 等环境下忽略地址栏同步 */
      }
    }

    if (options.scrollTop) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  async function initCategory() {
    const sidebar = $('#catSidebar');
    const content = $('#catContent');
    if (!sidebar || !content) return;

    categories = await fetchCategories();

    if (!categories.length) {
      content.setAttribute('aria-busy', 'false');
      content.innerHTML = `
        <div class="search-empty">
          <span class="emoji" aria-hidden="true">🧺</span>
          <b>分类暂时走丢了</b>
          <span>刷新页面再试一次吧</span>
        </div>`;
      return;
    }

    sidebar.innerHTML = categories
      .map(
        (category) => `
          <button class="cat-tab" type="button" data-cat="${escapeHtml(category.id)}">
            ${escapeHtml(category.name)}
          </button>`
      )
      .join('');

    const initialCategoryId = new URLSearchParams(window.location.search).get('cat');
    selectCategory(initialCategoryId || categories[0].id, { updateUrl: false });

    sidebar.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-cat]');
      if (!tab) return;
      selectCategory(tab.dataset.cat, { updateUrl: true, scrollTop: true });
    });

    content.addEventListener('click', (event) => {
      const subcategory = event.target.closest('[data-subcat]');
      if (!subcategory) return;
      const category = categories.find((item) => item.id === activeCategoryId);
      showToast(`「${subcategory.dataset.subcat}」精选商品正在上新，先看看${category ? category.name : ''}好物`);
    });

    if (initialCategoryId) {
      const activeTab = sidebar.querySelector(`[data-cat="${CSS.escape(initialCategoryId)}"]`);
      if (activeTab) activeTab.scrollIntoView({ block: 'center' });
    }
  }

  /* =========================================================
     Boot
     ========================================================= */

  if (page === 'home') {
    initHome();
  } else if (page === 'category') {
    initCategory();
  }
})();
