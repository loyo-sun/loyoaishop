const SHOP_TOKEN = "AFIM6DK1";
const API_BASE = "https://pay.ldxp.cn";

const fallbackShop = {
  nickname: "乐悦",
  description: "覆盖 Cursor、Gemini、ChatGPT、Codex 等热门工具。",
  contact_qq: "877715322",
  contact_wechat: "sunqing",
};

const fallbackProducts = [
  {
    goods_key: "kqg7pp",
    name: "Gemini Pro 12个月充值你的账号【质保一年丨官方订阅】",
    price: 79.6,
    image: "https://qn.ldxp.cn/fb/36794a027aefa7a05780da66b2a4b3.png",
    link: "https://pay.ldxp.cn/item/kqg7pp",
    category: { name: "Gemini" },
    description:
      "Gemini Pro 12个月充值你的账号，官方订阅，质保一年。充值成功后可获得 5T 云储存空间、NotebookLM 等权益。",
  },
  {
    goods_key: "fc9nzj",
    name: "Gemini Pro 12个月充值你的账号【质保充值成功丨官方订阅】",
    price: 16.92,
    image: "https://qn.ldxp.cn/de/7b37d75db54c78fb420fadc44e038e.png",
    link: "https://pay.ldxp.cn/item/fc9nzj",
    category: { name: "Gemini" },
    description:
      "Gemini Pro 12个月官方订阅充值服务，保障充值成功。下单后自动发货 CDK 卡密与充值链接。",
  },
  {
    goods_key: "4jbma6",
    name: "OpenAI Codex 手机接码（质保1次成功接码）",
    price: 3.98,
    image: "https://qn.ldxp.cn/54/16c9f45aa6adedd9537e76711bf552.png",
    link: "https://pay.ldxp.cn/item/4jbma6",
    category: { name: "Open Ai" },
    description:
      "OpenAI Codex 手机绑定接码 CDK，购买后自动发货。美国 +1 号码，质保一次成功接码。",
  },
];

const state = {
  products: fallbackProducts,
  categories: ["全部", "Gemini", "Open Ai"],
  activeCategory: "全部",
};

const elements = {
  year: document.querySelector("#year"),
  contactInfo: document.querySelector("#contactInfo"),
  productGrid: document.querySelector("#productGrid"),
  categoryFilters: document.querySelector("#categoryFilters"),
};

elements.year.textContent = new Date().getFullYear();

function postApi(path, payload) {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  });
}

function htmlToText(html = "") {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}

function summarize(product) {
  const text = htmlToText(product.description || "");
  if (!text) return "查看商品详情了解购买须知、使用范围和售后政策。";
  const contentIndex = text.indexOf("商品内容");
  const usefulText = contentIndex >= 0 ? text.slice(contentIndex) : text;
  return usefulText.length > 150 ? `${usefulText.slice(0, 150)}...` : usefulText;
}

function formatPrice(price) {
  return Number(price || 0).toFixed(Number(price) % 1 === 0 ? 0 : 2);
}

function normalizeProduct(product) {
  return {
    ...product,
    link: product.link || `${API_BASE}/item/${product.goods_key}`,
    summary: summarize(product),
    categoryName: product.category?.name || "商品",
  };
}

function renderFilters() {
  elements.categoryFilters.innerHTML = "";
  state.categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `filter-button${category === state.activeCategory ? " active" : ""}`;
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => {
      state.activeCategory = category;
      renderFilters();
      renderProducts();
    });
    elements.categoryFilters.append(button);
  });
}

function renderProducts() {
  const products = state.products
    .map(normalizeProduct)
    .filter((product) => state.activeCategory === "全部" || product.categoryName === state.activeCategory);

  elements.productGrid.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-media">
        <img alt="${escapeHtml(product.name)}" src="${escapeHtml(product.image)}" loading="lazy" />
        <span class="badge">${escapeHtml(product.categoryName)}</span>
      </div>
      <div class="product-body">
        <h3 class="product-title">${escapeHtml(product.name)}</h3>
        <p class="product-summary">${escapeHtml(product.summary)}</p>
        <div class="product-meta">
          <span class="pill">卡密</span>
          <span class="pill">自动发货</span>
          <span class="pill">安全下单</span>
        </div>
        <div class="product-footer">
          <div class="price"><small>¥</small>${formatPrice(product.price)}</div>
          <a class="buy-link" href="${escapeHtml(product.link)}" target="_blank" rel="noreferrer">立即购买</a>
        </div>
      </div>
    `;

    elements.productGrid.append(card);
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}

function applyShopInfo(shop) {
  const contacts = [];
  if (shop.contact_wechat) contacts.push(`微信 ${shop.contact_wechat}`);
  if (shop.contact_qq) contacts.push(`QQ ${shop.contact_qq}`);
  elements.contactInfo.textContent = contacts.length ? contacts.join(" / ") : "请通过商品详情页联系店铺客服";
}

async function syncProducts() {
  renderFilters();
  renderProducts();

  try {
    const [shopResult, categoryResult, goodsResult] = await Promise.all([
      postApi("/shopApi/Shop/info", { token: SHOP_TOKEN }),
      postApi("/shopApi/Shop/categoryList", { token: SHOP_TOKEN, goods_type: "card" }),
      postApi("/shopApi/Shop/goodsList", {
        token: SHOP_TOKEN,
        keywords: "",
        category_id: 0,
        goods_type: "card",
        current: 1,
        pageSize: 20,
      }),
    ]);

    if (shopResult.code === 1) {
      applyShopInfo(shopResult.data);
    }

    if (categoryResult.code === 1) {
      state.categories = categoryResult.data.map((category) => category.name);
    }

    if (goodsResult.code === 1 && Array.isArray(goodsResult.data?.list)) {
      state.products = goodsResult.data.list;
    }

  } catch (error) {
    applyShopInfo(fallbackShop);
  }

  renderFilters();
  renderProducts();
}

syncProducts();
