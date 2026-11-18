const products = [
  {
    id: "linen-journal",
    name: "The Linen Journal",
    category: "Desk",
    price: 24,
    tag: "Bestseller",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80",
    alt: "Open notebook and pen on a warm neutral desk",
  },
  {
    id: "everyday-cup",
    name: "Everyday Ceramic Cup",
    category: "Home",
    price: 32,
    tag: "Small batch",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    alt: "Handmade ceramic cup in a soft neutral glaze",
  },
  {
    id: "market-tote",
    name: "Market Day Tote",
    category: "Carry",
    price: 28,
    tag: "",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
    alt: "Natural canvas tote bag ready for a market day",
  },
  {
    id: "desk-light",
    name: "Little Desk Light",
    category: "Home",
    price: 68,
    tag: "Made to last",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    alt: "Warm light from a simple modern table lamp",
  },
  {
    id: "soft-cover",
    name: "Soft Cover Notebook",
    category: "Desk",
    price: 18,
    tag: "",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
    alt: "Notebook and writing tools on a tidy desk",
  },
  {
    id: "weekend-bottle",
    name: "Weekend Water Bottle",
    category: "Carry",
    price: 36,
    tag: "On the go",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
    alt: "Reusable water bottle in a muted color",
  },
  {
    id: "clay-vase",
    name: "Sunday Clay Vase",
    category: "Home",
    price: 42,
    tag: "Small batch",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=80",
    alt: "Sculptural ceramic vase with a simple branch",
  },
  {
    id: "pen-set",
    name: "Slow Morning Pen Set",
    category: "Desk",
    price: 16,
    tag: "",
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=900&q=80",
    alt: "Minimal writing pen on cream paper",
  },
];

const FREE_SHIPPING_THRESHOLD = 75;
const STORAGE_KEY = "sunday-supply-cart";
const productGrid = document.querySelector("#product-grid");
const categoryList = document.querySelector("#category-list");
const searchInput = document.querySelector("#product-search");
const cartDrawer = document.querySelector("#cart-drawer");
const checkoutModal = document.querySelector("#checkout-modal");
const overlay = document.querySelector("#overlay");
const toast = document.querySelector("#toast");

let activeCategory = "All";
let cart = loadCart();
let toastTimer;

function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((entry) =>
      entry &&
      products.some((product) => product.id === entry.id) &&
      Number.isInteger(entry.quantity) &&
      entry.quantity > 0
    );
  } catch (error) {
    console.warn("Could not load the saved shopping bag.", error);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Could not save the shopping bag.", error);
  }
}

function getCartCount() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function getSubtotal() {
  return cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}

function renderCategories() {
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  categoryList.innerHTML = categories.map((category) => `
    <button class="category-button${category === activeCategory ? " active" : ""}"
      type="button" aria-pressed="${category === activeCategory}" data-category="${category}">
      ${category}
    </button>
  `).join("");
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.category} ${product.tag}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (!visibleProducts.length) {
    productGrid.innerHTML = '<p class="no-results">Nothing here just yet. Try another search or category.</p>';
    return;
  }

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.alt}" loading="lazy" />
        ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}
        <button class="add-button" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button>
      </div>
      <div class="product-meta">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>
      </div>
      <p class="product-category">${product.category}</p>
    </article>
  `).join("");
}

function renderCart() {
  const count = getCartCount();
  const subtotal = getSubtotal();
  document.querySelector("#cart-count").textContent = count;
  document.querySelector("#drawer-count").textContent = `(${count})`;
  document.querySelector("#cart-subtotal").textContent = formatPrice(subtotal);

  const empty = cart.length === 0;
  document.querySelector("#cart-empty").classList.toggle("visible", empty);
  document.querySelector("#drawer-footer").classList.toggle("is-empty", empty);
  document.querySelector("#cart-items").hidden = empty;

  document.querySelector("#cart-items").innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) return "";
    return `
      <article class="cart-line">
        <img src="${product.image}" alt="" />
        <div class="cart-line-info">
          <h3 class="cart-line-name">${product.name}</h3>
          <span class="cart-line-price">${formatPrice(product.price)} each</span>
          <div class="quantity-control" aria-label="Quantity for ${product.name}">
            <button type="button" data-quantity="-1" data-id="${product.id}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-quantity="1" data-id="${product.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-line-end">
          <span>${formatPrice(product.price * item.quantity)}</span>
          <button class="remove-item" type="button" data-remove="${product.id}">Remove</button>
        </div>
      </article>
    `;
  }).join("");

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  document.querySelector("#shipping-note").textContent = subtotal >= FREE_SHIPPING_THRESHOLD
    ? "Lovely — your order ships free."
    : `You’re ${formatPrice(remaining)} away from free shipping.`;
}

function addToCart(id) {
  const item = cart.find((entry) => entry.id === id);
  if (item) item.quantity += 1;
  else cart.push({ id, quantity: 1 });
  saveCart();
  renderCart();
  const product = products.find((entry) => entry.id === id);
  showToast(`${product.name} added to your bag`);
}

function changeQuantity(id, amount) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== id);
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

function syncOverlay() {
  const isOpen = cartDrawer.classList.contains("open") || checkoutModal.classList.contains("open");
  overlay.hidden = !isOpen;
  requestAnimationFrame(() => overlay.classList.toggle("visible", isOpen));
  document.body.classList.toggle("has-overlay", isOpen);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  syncOverlay();
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  syncOverlay();
}

function renderCheckout() {
  document.querySelector("#checkout-items").innerHTML = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `<div class="checkout-line"><span>${product.name} <span aria-label="quantity">× ${item.quantity}</span></span><span>${formatPrice(product.price * item.quantity)}</span></div>`;
  }).join("");

  const subtotal = getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6;
  document.querySelector("#checkout-totals").innerHTML = `
    <div class="checkout-total-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div class="checkout-total-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
    <div class="checkout-total-row"><span>Estimated tax</span><span>${formatPrice(subtotal * 0.08)}</span></div>
    <div class="checkout-total-row total"><span>Estimated total</span><span>${formatPrice(subtotal + shipping + subtotal * 0.08)}</span></div>
  `;
}

function openCheckout() {
  if (cart.length === 0) return;
  renderCheckout();
  closeCart();
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  syncOverlay();
  document.querySelector("#close-checkout").focus();
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  syncOverlay();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
}

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderCategories();
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
document.querySelector("#continue-shopping").addEventListener("click", () => {
  closeCart();
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
});
document.querySelector("#cart-items").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) changeQuantity(quantityButton.dataset.id, Number(quantityButton.dataset.quantity));
  if (removeButton) removeFromCart(removeButton.dataset.remove);
});
document.querySelector("#checkout-button").addEventListener("click", openCheckout);
document.querySelector("#close-checkout").addEventListener("click", closeCheckout);
document.querySelector("#place-order").addEventListener("click", () => {
  cart = [];
  saveCart();
  renderCart();
  closeCheckout();
  showToast("Your demo order is all set. Thanks for stopping by!");
});
overlay.addEventListener("click", () => {
  closeCart();
  closeCheckout();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeCart();
  closeCheckout();
});

renderCategories();
renderProducts();
renderCart();
