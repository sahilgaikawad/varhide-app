(function () {
  var debounceTimer = null;
  var isFetching = false;
  var syncIntervalId = null;

  // --- SMART CONFIGURATION ---
  var BASE_INTERVAL = 4000;    // 4 Seconds (Normal Speed)
  var IDLE_TIMEOUT = 60000;    // 60 Seconds (Agar user inactive hai toh ruk jao)
  var MAX_BACKOFF = 30000;     // Error aane par max 30 sec wait karenge

  // State Management
  var state = {
    enabled: true,
    hiddenValues: [],
    lastActivity: Date.now(),
    currentInterval: BASE_INTERVAL,
    isIdle: false
  };

  // --- 1. USER ACTIVITY TRACKER (Idle Detection) ---
  function resetIdleTimer() {
    state.lastActivity = Date.now();
    if (state.isIdle) {
      // User wapis aa gaya! Polling fast kar do aur turant check karo
      console.log("Varhide: User active again. Resuming sync.");
      state.isIdle = false;
      state.currentInterval = BASE_INTERVAL;
      restartPolling();
      checkStockUpdates(); // Instant check
    }
  }

  function setupActivityListeners() {
    ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(evt => {
      document.addEventListener(evt, () => {
        // Performance ke liye throttle (har baar mat chalao)
        if (Date.now() - state.lastActivity > 1000) resetIdleTimer();
      });
    });
  }

  // --- 2. DATA LOADERS ---
  function getInitialData() {
    var el = document.getElementById("varhide-hidden-variants");
    if (!el) return null;
    try {
      var data = JSON.parse(el.textContent);
      if (data.enabled === "false" || data.enabled === false) {
        data.enabled = false;
      } else {
        data.enabled = true;
      }
      return data;
    } catch (e) { return null; }
  }

  function injectStyles() {
    if (document.getElementById('varhide-css-patch')) return;
    var css = `
      .varhide-forced-available {
        text-decoration: none !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        cursor: pointer !important;
      }
      .varhide-forced-available::before,
      .varhide-forced-available::after { display: none !important; content: none !important; }
      .varhide-forced-available-wrapper { text-decoration: none !important; opacity: 1 !important; }
    `;
    var style = document.createElement('style');
    style.id = 'varhide-css-patch';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // --- 3. UI UPDATE LOGIC ---
  function updateUI() {
    var hiddenValues = state.hiddenValues || [];
    var inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');

    inputs.forEach(function (input) {
      var value = (input.value || "").trim();
      var label = input.id ? document.querySelector('label[for="' + CSS.escape(input.id) + '"]') : input.closest("label");
      var isOutOfStock = hiddenValues.includes(value);

      if (isOutOfStock) {
        if (state.enabled) {
          // Case A: App ON + No Stock -> Hide
          input.style.display = "none";
          input.disabled = true;
          if (input.checked) input.checked = false;
          if (label) {
            label.style.display = "none";
            label.classList.remove('varhide-forced-available');
          }
        } else {
          // Case B: App OFF + No Stock -> Show
          input.style.display = "";
          input.disabled = false;
          if (label) {
            label.style.display = "";
            label.classList.remove('varhide-forced-available');
          }
        }
      } else {
        // Case C: Stock Available -> Show & Clean
        input.style.display = "";
        input.disabled = false;
        if (label) {
          label.style.display = "";
          var classesToRemove = ['disabled', 'unavailable', 'sold-out', 'is-disabled', 'visually-disabled'];
          label.classList.remove(...classesToRemove);
          if (label.parentElement) label.parentElement.classList.remove(...classesToRemove);
          label.classList.add('varhide-forced-available');
          if (label.parentElement) label.parentElement.classList.add('varhide-forced-available-wrapper');
        }
      }
    });
  }

  function runVarhide() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateUI, 50);
  }

  // --- 4. ENGINE: STOCK CHECKER ---
  async function checkStockUpdates() {
    // A. Checks
    if (document.hidden) return; // Tab background mein hai
    if (isFetching) return;

    // B. Idle Check
    if (Date.now() - state.lastActivity > IDLE_TIMEOUT) {
      if (!state.isIdle) {
        console.log("Varhide: User idle. Pausing updates to save resources.");
        state.isIdle = true;
        clearInterval(syncIntervalId); // Stop polling
      }
      return;
    }

    isFetching = true;

    try {
      var jsonUrl = window.location.pathname;
      if (jsonUrl.includes('/products/')) {
        if (!jsonUrl.endsWith('.js')) jsonUrl += '.js';
        jsonUrl += '?v=' + new Date().getTime();

        const response = await fetch(jsonUrl);

        if (!response.ok) {
          // Error Handling: Backoff Strategy
          throw new Error("API Error");
        }

        // Success: Reset interval to fast speed
        if (state.currentInterval > BASE_INTERVAL) {
          state.currentInterval = BASE_INTERVAL;
          restartPolling();
        }

        const productData = await response.json();
        var newHiddenList = [];
        if (productData.variants) {
          productData.variants.forEach(function (variant) {
            if (!variant.available) newHiddenList.push(variant.option1);
          });
        }

        var currentHiddenStr = JSON.stringify((state.hiddenValues || []).sort());
        var newHiddenStr = JSON.stringify(newHiddenList.sort());

        if (currentHiddenStr !== newHiddenStr) {
          state.hiddenValues = newHiddenList;
          // Update Script Tag
          var el = document.getElementById("varhide-hidden-variants");
          if (el) {
            try {
              var d = JSON.parse(el.textContent);
              d.hidden_option_values = newHiddenList;
              el.textContent = JSON.stringify(d);
            } catch (e) { }
          }
          runVarhide();
        }
      }
    } catch (err) {
      // Error Recovery: Increase interval (4s -> 8s -> 16s...)
      var nextInterval = Math.min(state.currentInterval * 2, MAX_BACKOFF);
      console.warn(`Varhide: Error detected. Slowing down check to ${nextInterval}ms`);
      state.currentInterval = nextInterval;
      restartPolling();
    } finally {
      isFetching = false;
    }
  }

  function restartPolling() {
    clearInterval(syncIntervalId);
    syncIntervalId = setInterval(checkStockUpdates, state.currentInterval);
  }

  function boot() {
    injectStyles();
    setupActivityListeners();

    var initialData = getInitialData();
    if (initialData) {
      state.enabled = initialData.enabled;
      state.hiddenValues = initialData.hidden_option_values || [];
    }

    updateUI();

    // Observers
    document.addEventListener("change", function (e) {
      if (e.target.matches('input[type="radio"], input[type="checkbox"], select')) runVarhide();
    });

    var productForm = document.querySelector('form[action*="/cart"]') || document.querySelector("product-form") || document.body;
    if (productForm) {
      observer = new MutationObserver(runVarhide);
      observer.observe(productForm, { childList: true, subtree: true, attributes: true });
    }

    document.addEventListener("shopify:section:load", function () {
      injectStyles();
      var fresh = getInitialData();
      if (fresh) {
        state.enabled = fresh.enabled;
        state.hiddenValues = fresh.hidden_option_values;
        updateUI();
      }
    });

    // Start
    restartPolling();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();