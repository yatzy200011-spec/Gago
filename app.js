/* --------------------------------------------------
     * DEFAULT STORE DEMO DATA
     * -------------------------------------------------- */
    const DEFAULT_PRODUCTS = [
      { id: 'p1', name: 'Pigrolac Starter Pellets', category: 'Feeds', sackWeightKg: 50, priceSack: 1550, priceKilo: 33, stockSacks: 15, openSacks: 1, lowStockThreshold: 10 },
      { id: 'p2', name: 'B-Meg Layer Feeds', category: 'Feeds', sackWeightKg: 50, priceSack: 1480, priceKilo: 31, stockSacks: 8, openSacks: 1, lowStockThreshold: 10 },
      { id: 'p3', name: 'Thunderbird Gamefowl Feeds', category: 'Feeds', sackWeightKg: 25, priceSack: 1200, priceKilo: 50, stockSacks: 4, openSacks: 0, lowStockThreshold: 5 },
      { id: 'p4', name: 'Dinorado Special Rice', category: 'Rice', sackWeightKg: 50, priceSack: 2600, priceKilo: 54, stockSacks: 20, openSacks: 1, lowStockThreshold: 10 },
      { id: 'p5', name: 'Sinandomeng Super White', category: 'Rice', sackWeightKg: 50, priceSack: 2350, priceKilo: 48, stockSacks: 18, openSacks: 0, lowStockThreshold: 10 },
      { id: 'p6', name: 'Jasmine Premium Rice', category: 'Rice', sackWeightKg: 25, priceSack: 1350, priceKilo: 56, stockSacks: 12, openSacks: 1, lowStockThreshold: 8 },
      { id: 'p7', name: 'Poultry Vitamin Water Soluble', category: 'Supplement', sackWeightKg: 1, priceSack: 250, priceKilo: 250, stockSacks: 30, openSacks: 0, lowStockThreshold: 10 }
    ];

    const DEFAULT_UTANG = [
      { id: 'u1', customerName: 'Mang Pedro Santos', phone: '09171234567', totalBalance: 3100, lastUpdated: new Date().toISOString(), history: ['Initial Credit: 1 Bag Pigrolac + 1 Bag Dinorado'] },
      { id: 'u2', customerName: 'Aling Rosa Mercado', phone: '09289876543', totalBalance: 960, lastUpdated: new Date().toISOString(), history: ['Initial Credit: 20 Kg Sinandomeng'] }
    ];

    // State Variables
    let products = JSON.parse(localStorage.getItem('agri_products')) || DEFAULT_PRODUCTS;
    let sales = JSON.parse(localStorage.getItem('agri_sales')) || [];
    let utangLedger = JSON.parse(localStorage.getItem('agri_utang')) || DEFAULT_UTANG;
    let cashOutRecords = JSON.parse(localStorage.getItem('agri_cashout')) || [];
    let cart = [];
    let activeCategoryFilter = 'All';
    let currentPayUtangId = null;

    // Safety field check
    products = products.map(p => {
      if (p.openSacks === undefined) p.openSacks = 0;
      if (p.lowStockThreshold === undefined) p.lowStockThreshold = 10;
      return p;
    });

    /* --------------------------------------------------
     * INITIALIZATION
     * -------------------------------------------------- */
    window.onload = function() {
      saveState();
      updateClock();
      setInterval(updateClock, 1000);
      switchTab('dashboard');
    };

    function saveState() {
      localStorage.setItem('agri_products', JSON.stringify(products));
      localStorage.setItem('agri_sales', JSON.stringify(sales));
      localStorage.setItem('agri_utang', JSON.stringify(utangLedger));
      localStorage.setItem('agri_cashout', JSON.stringify(cashOutRecords));
    }

    function resetDataToDefault() {
      if (confirm('Are you sure you want to reset all inventory and transaction data to defaults?')) {
        localStorage.clear();
        products = DEFAULT_PRODUCTS;
        sales = [];
        utangLedger = DEFAULT_UTANG;
        cashOutRecords = [];
        cart = [];
        saveState();
        location.reload();
      }
    }

    function updateClock() {
      const now = new Date();
      document.getElementById('nav-date-time').innerText = now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString();
    }

    /* --------------------------------------------------
     * NAVIGATION TAB SWITCHING
     * -------------------------------------------------- */
    function switchTab(tabId) {
      document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-brand-700', 'text-white', 'shadow-xs');
        btn.classList.add('text-slate-700', 'hover:bg-slate-100');
      });

      const selectedView = document.getElementById(`view-${tabId}`);
      if (selectedView) selectedView.classList.remove('hidden');

      const activeBtn = document.getElementById(`nav-${tabId}`);
      if (activeBtn) {
        activeBtn.classList.add('bg-brand-700', 'text-white', 'shadow-xs');
        activeBtn.classList.remove('text-slate-700', 'hover:bg-slate-100');
      }

      if (tabId === 'dashboard') renderDashboard();
      if (tabId === 'pos') renderPosProducts();
      if (tabId === 'inventory') renderInventoryTable();
      if (tabId === 'credit') renderUtangLedger();
      if (tabId === 'reports') renderReports();
      if (tabId === 'cashout') renderCashOut();
    }

    /* --------------------------------------------------
     * 1. DASHBOARD LOGIC
     * -------------------------------------------------- */
    function renderDashboard() {
      const todayStr = new Date().toDateString();
      const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === todayStr);

      const totalSalesAmount = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
      document.getElementById('dash-sales-today').innerText = `₱${totalSalesAmount.toLocaleString('en-US', {minimumFractionDigits:2})}`;
      document.getElementById('dash-sales-count').innerText = `${todaySales.length} Transactions Recorded`;

      const cashSalesCollected = sales
        .filter(s => s.paymentType === 'Cash')
        .reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
      const creditCollections = utangLedger.reduce((acc, u) => {
        return acc + (u.history || []).reduce((sum, entry) => {
          const match = entry.match(/Paid: ₱([0-9,.]+)/);
          return sum + (match ? Number(match[1].replace(/,/g, '')) : 0);
        }, 0);
      }, 0);
      const totalCashOut = cashOutRecords.reduce((acc, r) => acc + Number(r.amount || 0), 0);
      const cashInDrawer = cashSalesCollected + creditCollections - totalCashOut;
      document.getElementById('dash-cash-in-drawer').innerText =
        `₱${cashInDrawer.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

      const totalSacks = products.reduce((acc, p) => acc + p.stockSacks, 0);
      const totalOpenSacks = products.reduce((acc, p) => acc + (p.openSacks || 0), 0);
      document.getElementById('dash-total-sacks').innerText = `${totalSacks} Bags`;
      document.getElementById('dash-total-kilos').innerText = `+ ${totalOpenSacks} active open sack(s)`;

      const totalUtangAmount = utangLedger.reduce((acc, u) => acc + u.totalBalance, 0);
      document.getElementById('dash-total-utang').innerText = `₱${totalUtangAmount.toLocaleString('en-US', {minimumFractionDigits:2})}`;
      document.getElementById('dash-utang-count').innerText = `${utangLedger.filter(u => u.totalBalance > 0).length} Unpaid customer ledger(s)`;

      // Dynamic Low Stock Alert based on individual threshold
      const lowStockItems = products.filter(p => p.stockSacks <= (p.lowStockThreshold ?? 10));
      document.getElementById('dash-low-stock-count').innerText = `${lowStockItems.length} Items`;

      // Open Sacks Monitoring Table
      const openSacksTbody = document.getElementById('dash-open-sacks-table');
      const itemsWithOpenSacks = products.filter(p => p.openSacks > 0);

      if (itemsWithOpenSacks.length === 0) {
        openSacksTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 text-xs">No opened sacks currently monitored. All sacks are intact.</td></tr>`;
      } else {
        openSacksTbody.innerHTML = itemsWithOpenSacks.map(p => `
          <tr class="hover:bg-slate-50">
            <td class="py-2.5 px-4 font-bold text-slate-900">
              ${p.name} 
              <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ml-1 ${p.category === 'Rice' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}">${p.category}</span>
            </td>
            <td class="py-2.5 px-4 text-slate-600 font-medium">${p.sackWeightKg} kg / bag</td>
            <td class="py-2.5 px-4 font-bold font-mono text-slate-900">₱${p.priceKilo.toFixed(2)}</td>
            <td class="py-2.5 px-4 text-center">
              <button onclick="markSackAsSold('${p.id}')" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-xs transition-colors mx-auto">
                ✓ Mark Finished
              </button>
            </td>
          </tr>
        `).join('');
      }

      // Low Stock Table
      const lowStockTbody = document.getElementById('dash-low-stock-table');
      if (lowStockItems.length === 0) {
        lowStockTbody.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-slate-400 text-xs">All stock levels are optimal.</td></tr>`;
      } else {
        lowStockTbody.innerHTML = lowStockItems.map(p => `
          <tr class="hover:bg-slate-50">
            <td class="p-2 font-semibold text-slate-800">${p.name}</td>
            <td class="p-2"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${p.category === 'Rice' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}">${p.category}</span></td>
            <td class="p-2 text-right font-bold font-mono text-amber-600">${p.stockSacks} / ${p.lowStockThreshold ?? 10} Sacks</td>
          </tr>
        `).join('');
      }

      // Recent Sales Table
      const recentSalesTbody = document.getElementById('dash-recent-sales-table');
      const recentSales = [...sales].reverse().slice(0, 5);
      if (recentSales.length === 0) {
        recentSalesTbody.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-slate-400 text-xs">No sales recorded yet.</td></tr>`;
      } else {
        recentSalesTbody.innerHTML = recentSales.map(s => `
          <tr class="hover:bg-slate-50">
            <td class="p-2 text-slate-500 font-mono text-[11px]">${new Date(s.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
            <td class="p-2 font-medium text-slate-800">${s.customerName || 'Cash Customer'} <span class="text-[10px] font-bold ${s.paymentType === 'Utang' ? 'text-red-600' : 'text-emerald-700'}">(${s.paymentType === 'Utang' ? 'Credit' : s.paymentType})</span></td>
            <td class="p-2 text-right font-bold font-mono text-slate-900">₱${s.totalAmount.toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    function markSackAsSold(productId) {
      const p = products.find(prod => prod.id === productId);
      if (p && p.openSacks > 0) {
        p.openSacks -= 1;
        saveState();
        renderDashboard();
        showToast(`Open sack of ${p.name} marked as empty!`, 'success');
      }
    }

    /* --------------------------------------------------
     * 2. POINT OF SALE (POS) LOGIC
     * -------------------------------------------------- */
    function filterPosCategory(category) {
      activeCategoryFilter = category;
      document.querySelectorAll('.pos-cat-btn').forEach(btn => {
        if (btn.dataset.cat === category) {
          btn.classList.remove('bg-slate-100', 'text-slate-700');
          btn.classList.add('bg-brand-700', 'text-white');
        } else {
          btn.classList.remove('bg-brand-700', 'text-white');
          btn.classList.add('bg-slate-100', 'text-slate-700');
        }
      });
      renderPosProducts();
    }

    function filterPosProducts() {
      renderPosProducts();
    }

    function renderPosProducts() {
      const grid = document.getElementById('pos-product-grid');
      const searchTerm = document.getElementById('pos-search-input').value.toLowerCase();

      const filtered = products.filter(p => {
        const matchesCat = (activeCategoryFilter === 'All') || (p.category === activeCategoryFilter);
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        return matchesCat && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-xs">No matching products found.</div>`;
        return;
      }

      grid.innerHTML = filtered.map(p => `
        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-brand-600 transition-colors flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start gap-1">
              <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug">${p.name}</h4>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${p.category === 'Rice' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}">${p.category}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">
              In Stock: <span class="font-bold text-slate-800">${p.stockSacks} sacks</span> | Open: <span class="font-bold text-amber-700">${p.openSacks || 0}</span>
            </p>
          </div>

          <div class="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
            <!-- FULL SACK OPTION -->
            <div class="p-2 bg-slate-50 rounded border border-slate-200/80 space-y-1">
              <div class="flex justify-between text-[10px] text-slate-600 font-bold">
                <span>FULL SACK (Reg: ₱${p.priceSack.toFixed(2)})</span>
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <div>
                  <label class="text-[9px] text-slate-500 font-bold block">Qty (Sacks)</label>
                  <input type="number" step="1" id="custom-qty-sack-${p.id}" value="1" class="w-full px-1.5 py-0.5 text-xs border rounded bg-white font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-brand-600">
                </div>
                <div>
                  <label class="text-[9px] text-slate-500 font-bold block">Sell Price (₱)</label>
                  <input type="number" step="0.01" id="custom-price-sack-${p.id}" value="${p.priceSack}" class="w-full px-1.5 py-0.5 text-xs border rounded bg-white font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-brand-600">
                </div>
              </div>
              <button onclick="addCustomPriceToCart('${p.id}', 'Sack')" class="w-full py-1 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1 mt-1">
                + Add Full Sack
              </button>
            </div>

            <!-- PER KILO / OPEN SACK OPTION -->
            <div class="p-2 bg-amber-50/50 rounded border border-amber-200/80 space-y-1">
              <div class="flex justify-between text-[10px] text-amber-900 font-bold">
                <span>PER KILO / OPEN SACK</span>
              </div>
              <div>
                <label class="text-[9px] text-slate-500 font-bold block">Price / Kilo (₱)</label>
                <input type="number" step="0.01" id="custom-price-opensack-${p.id}" value="${p.priceKilo}" class="w-full px-1.5 py-0.5 text-xs border rounded bg-white font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500">
              </div>
              <button onclick="addCustomPriceToCart('${p.id}', 'From Open Sack')" class="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1 mt-1">
                + Add Per Kilo
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    function addCustomPriceToCart(productId, unitType) {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const inputKey = unitType === 'Sack' ? 'sack' : 'opensack';
      const qtyInput = unitType === 'Sack' ? document.getElementById(`custom-qty-${inputKey}-${productId}`) : null;
      const priceInput = document.getElementById(`custom-price-${inputKey}-${productId}`);

      const qty = qtyInput ? parseFloat(qtyInput.value) : 1;
      const customPrice = parseFloat(priceInput ? priceInput.value : 0);

      const finalQty = (!isNaN(qty) && qty > 0) ? qty : 1;
      const originalPrice = unitType === 'Sack' ? product.priceSack : product.priceKilo;
      const finalPrice = (!isNaN(customPrice) && customPrice >= 0) ? customPrice : originalPrice;

      const existingIndex = cart.findIndex(item => item.productId === productId && item.unitType === unitType && item.unitPrice === finalPrice);

      if (existingIndex > -1) {
        cart[existingIndex].qty += finalQty;
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          unitType: unitType,
          originalPrice: originalPrice,
          unitPrice: finalPrice,
          qty: finalQty
        });
      }

      showToast(`Added ${finalQty} ${unitType}(s) of ${product.name}`, 'success');
      renderCart();
    }

    function updateCartQty(index, delta) {
      if (cart[index]) {
        cart[index].qty = Math.round((cart[index].qty + delta) * 100) / 100;
        if (cart[index].qty <= 0) {
          cart.splice(index, 1);
        }
      }
      renderCart();
    }

    function setCartQtyDirect(index, value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) {
        cart[index].qty = parsed;
      }
      renderCart();
    }

    function removeFromCart(index) {
      cart.splice(index, 1);
      renderCart();
    }

    function clearCart() {
      cart = [];
      renderCart();
    }

    function renderCart() {
      const container = document.getElementById('pos-cart-items');

      if (cart.length === 0) {
        container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">Cart is currently empty</div>`;
        document.getElementById('cart-item-count').innerText = '0 items';
        document.getElementById('cart-total-amount').innerText = '₱0.00';
        calculateChange();
        return;
      }

      let total = 0;
      let totalItemsCount = 0;

      container.innerHTML = cart.map((item, idx) => {
        const itemTotal = item.unitPrice * item.qty;
        total += itemTotal;
        totalItemsCount += item.qty;

        const isDiscounted = item.unitPrice < item.originalPrice;

        return `
          <div class="pt-2 first:pt-0 flex items-center justify-between text-xs gap-2">
            <div class="flex-1 min-w-0">
              <h5 class="font-bold text-slate-800 truncate">${item.name}</h5>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[10px] px-1 py-0.2 rounded font-bold ${item.unitType === 'Sack' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${item.unitType}</span>
                <span class="text-slate-500 font-mono">@₱${item.unitPrice.toFixed(2)}</span>
                ${isDiscounted ? '<span class="text-[9px] bg-red-100 text-red-600 font-bold px-1 rounded">Discounted</span>' : ''}
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button onclick="updateCartQty(${idx}, -1)" class="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold flex items-center justify-center text-xs">-</button>
              <input type="number" step="0.01" value="${item.qty}" onchange="setCartQtyDirect(${idx}, this.value)" class="w-12 text-center border border-slate-300 rounded font-mono font-bold text-xs py-0.5">
              <button onclick="updateCartQty(${idx}, 1)" class="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-bold flex items-center justify-center text-xs">+</button>
            </div>

            <div class="text-right min-w-[65px]">
              <div class="font-bold text-slate-900 font-mono">₱${itemTotal.toFixed(2)}</div>
              <button onclick="removeFromCart(${idx})" class="text-[10px] text-red-600 hover:underline">Remove</button>
            </div>
          </div>
        `;
      }).join('');

      document.getElementById('cart-item-count').innerText = `${totalItemsCount} total units`;
      document.getElementById('cart-total-amount').innerText = `₱${total.toFixed(2)}`;
      calculateChange();
    }

    function toggleUtangFields() {
      const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
      const cashFields = document.getElementById('cash-payment-fields');
      const utangFields = document.getElementById('utang-payment-fields');

      if (paymentType === 'Cash') {
        cashFields.classList.remove('hidden');
        utangFields.classList.add('hidden');
      } else {
        cashFields.classList.add('hidden');
        utangFields.classList.remove('hidden');
      }
    }

    function calculateChange() {
      const totalAmount = cart.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
      const tendered = parseFloat(document.getElementById('cash-tendered').value) || 0;
      const change = tendered - totalAmount;
      const changeEl = document.getElementById('cash-change');

      if (change >= 0) {
        changeEl.innerText = `₱${change.toFixed(2)}`;
        changeEl.classList.remove('text-red-600');
        changeEl.classList.add('text-emerald-700');
      } else {
        changeEl.innerText = `Short: ₱${Math.abs(change).toFixed(2)}`;
        changeEl.classList.remove('text-emerald-700');
        changeEl.classList.add('text-red-600');
      }
    }

    /* --------------------------------------------------
     * CHECKOUT & OPEN SACK DEDUCTION LOGIC
     * -------------------------------------------------- */
    function processCheckout() {
      if (cart.length === 0) {
        showToast('Cart is empty!', 'error');
        return;
      }

      const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
      const totalAmount = cart.reduce((acc, item) => acc + (item.unitPrice * item.qty), 0);
      let customerName = 'Cash Customer';
      let customerPhone = '';
      let cashTendered = 0;
      let change = 0;

      if (paymentType === 'Cash') {
        cashTendered = parseFloat(document.getElementById('cash-tendered').value) || 0;
        if (cashTendered < totalAmount) {
          showToast('Cash tendered is less than total amount!', 'error');
          return;
        }
        change = cashTendered - totalAmount;
      } else {
        customerName = document.getElementById('utang-customer-name').value.trim();
        customerPhone = document.getElementById('utang-customer-phone').value.trim();
        if (!customerName) {
          showToast('Please enter the customer name for credit transaction!', 'error');
          return;
        }
      }

      // Verify stock
      for (let item of cart) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) continue;

        if (item.unitType === 'Sack' && prod.stockSacks < item.qty) {
          showToast(`Insufficient sack inventory for ${prod.name}!`, 'error');
          return;
        }
      }

      // Deduct inventory & handle open sack tracking
      cart.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) return;

        if (item.unitType === 'Sack') {
          prod.stockSacks -= item.qty;
        } else if (item.unitType === 'From Open Sack') {
          if (prod.openSacks <= 0) {
            if (prod.stockSacks > 0) {
              prod.stockSacks -= 1;
              prod.openSacks = 1;
            } else {
              prod.openSacks = 1;
            }
          }
        }
      });

      // Record Transaction
      const txnId = 'TXN-' + Date.now().toString().slice(-6);
      const saleRecord = {
        id: txnId,
        timestamp: new Date().toISOString(),
        paymentType: paymentType,
        customerName: customerName,
        customerPhone: customerPhone,
        items: [...cart],
        totalAmount: totalAmount,
        cashTendered: cashTendered,
        change: change
      };

      sales.push(saleRecord);

      // Record to Utang Ledger if Credit
      if (paymentType === 'Utang') {
        const existingCustomer = utangLedger.find(u => u.customerName.toLowerCase() === customerName.toLowerCase());
        const itemSummary = cart.map(i => `${i.qty} ${i.unitType} ${i.name}`).join(', ');

        if (existingCustomer) {
          existingCustomer.totalBalance += totalAmount;
          existingCustomer.lastUpdated = new Date().toISOString();
          existingCustomer.history.push(`[${new Date().toLocaleDateString()}] Credit: ₱${totalAmount.toFixed(2)} (${itemSummary})`);
        } else {
          utangLedger.push({
            id: 'u-' + Date.now(),
            customerName: customerName,
            phone: customerPhone,
            totalBalance: totalAmount,
            lastUpdated: new Date().toISOString(),
            history: [`[${new Date().toLocaleDateString()}] Credit: ₱${totalAmount.toFixed(2)} (${itemSummary})`]
          });
        }
      }

      saveState();
      displayReceiptModal(saleRecord);

      // Clear Form
      cart = [];
      document.getElementById('cash-tendered').value = '';
      document.getElementById('utang-customer-name').value = '';
      document.getElementById('utang-customer-phone').value = '';
      renderCart();
      renderPosProducts();

      showToast('Transaction completed successfully!', 'success');
    }

    function displayReceiptModal(sale) {
      document.getElementById('receipt-date-time').innerText = new Date(sale.timestamp).toLocaleString();
      document.getElementById('receipt-txn-id').innerText = `Txn ID: ${sale.id}`;
      document.getElementById('receipt-total').innerText = `₱${sale.totalAmount.toFixed(2)}`;
      document.getElementById('receipt-payment-type').innerText = (sale.paymentType === 'Utang' ? 'CREDIT' : sale.paymentType.toUpperCase());

      const itemsList = document.getElementById('receipt-items-list');
      itemsList.innerHTML = sale.items.map(i => `
        <div class="flex justify-between">
          <span class="truncate pr-2">${i.qty} ${i.unitType} x ${i.name}</span>
          <span class="font-mono">₱${(i.unitPrice * i.qty).toFixed(2)}</span>
        </div>
      `).join('');

      const cashRow = document.getElementById('receipt-cash-row');
      const changeRow = document.getElementById('receipt-change-row');
      const custRow = document.getElementById('receipt-customer-row');

      if (sale.paymentType === 'Cash') {
        cashRow.classList.remove('hidden');
        changeRow.classList.remove('hidden');
        custRow.classList.add('hidden');
        document.getElementById('receipt-cash').innerText = `₱${sale.cashTendered.toFixed(2)}`;
        document.getElementById('receipt-change').innerText = `₱${sale.change.toFixed(2)}`;
      } else {
        cashRow.classList.add('hidden');
        changeRow.classList.add('hidden');
        custRow.classList.remove('hidden');
        document.getElementById('receipt-customer-name').innerText = sale.customerName;
      }

      document.getElementById('modal-receipt').classList.remove('hidden');
    }

    function closeReceiptModal() {
      document.getElementById('modal-receipt').classList.add('hidden');
    }

    /* --------------------------------------------------
     * 3. INVENTORY MANAGEMENT LOGIC
     * -------------------------------------------------- */
    function renderInventoryTable() {
      const tbody = document.getElementById('inventory-table-body');
      const search = document.getElementById('inventory-search').value.toLowerCase();
      const catFilter = document.getElementById('inventory-cat-filter').value;

      const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search);
        const matchesCat = (catFilter === 'All') || (p.category === catFilter);
        return matchesSearch && matchesCat;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">No items found in inventory.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(p => {
        const threshold = p.lowStockThreshold ?? 10;
        const isLowStock = p.stockSacks <= threshold;

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 font-bold text-slate-900">${p.name}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[11px] font-bold ${p.category === 'Rice' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}">${p.category}</span></td>
            <td class="p-3 font-mono font-bold text-slate-800">₱${p.priceSack.toFixed(2)}</td>
            <td class="p-3 font-mono font-bold text-slate-800">₱${p.priceKilo.toFixed(2)}</td>
            <td class="p-3 text-slate-600">${p.sackWeightKg} kg / bag</td>
            <td class="p-3">
              <div class="font-bold ${isLowStock ? 'text-amber-600' : 'text-slate-800'}">
                ${p.stockSacks} Sacks
                ${isLowStock ? `<span class="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded ml-1 font-bold">Low (&le;${threshold})</span>` : ''}
              </div>
              <div class="text-[11px] text-amber-800 font-semibold">+ ${p.openSacks || 0} open sack(s)</div>
            </td>
            <td class="p-3 text-center space-x-1">
              <button onclick="editProduct('${p.id}')" class="px-2 py-1 text-blue-700 hover:bg-blue-50 rounded font-semibold text-xs" title="Edit">Edit</button>
              <button onclick="deleteProduct('${p.id}')" class="px-2 py-1 text-red-600 hover:bg-red-50 rounded font-semibold text-xs" title="Delete">Delete</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function filterInventoryTable() {
      renderInventoryTable();
    }

    function openProductModal(productId = null) {
      const form = document.getElementById('product-form');
      form.reset();

      if (productId) {
        const p = products.find(prod => prod.id === productId);
        if (p) {
          document.getElementById('modal-product-title').innerText = 'Edit Product Details';
          document.getElementById('prod-id').value = p.id;
          document.getElementById('prod-name').value = p.name;
          document.getElementById('prod-category').value = p.category;
          document.getElementById('prod-weight').value = p.sackWeightKg;
          document.getElementById('prod-price-sack').value = p.priceSack;
          document.getElementById('prod-price-kilo').value = p.priceKilo;
          document.getElementById('prod-stock-sacks').value = p.stockSacks;
          document.getElementById('prod-open-sacks').value = p.openSacks || 0;
          document.getElementById('prod-low-threshold').value = p.lowStockThreshold ?? 10;
        }
      } else {
        document.getElementById('modal-product-title').innerText = 'Add New Inventory Item';
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-low-threshold').value = 10;
      }

      document.getElementById('modal-product').classList.remove('hidden');
    }

    function closeProductModal() {
      document.getElementById('modal-product').classList.add('hidden');
    }

    function saveProduct(event) {
      event.preventDefault();
      const id = document.getElementById('prod-id').value;
      const name = document.getElementById('prod-name').value.trim();
      const category = document.getElementById('prod-category').value;
      const sackWeightKg = parseFloat(document.getElementById('prod-weight').value);
      const priceSack = parseFloat(document.getElementById('prod-price-sack').value);
      const priceKilo = parseFloat(document.getElementById('prod-price-kilo').value);
      const stockSacks = parseInt(document.getElementById('prod-stock-sacks').value);
      const openSacks = parseInt(document.getElementById('prod-open-sacks').value);
      const lowStockThreshold = parseInt(document.getElementById('prod-low-threshold').value) || 10;

      if (id) {
        const index = products.findIndex(p => p.id === id);
        if (index > -1) {
          products[index] = { id, name, category, sackWeightKg, priceSack, priceKilo, stockSacks, openSacks, lowStockThreshold };
          showToast('Product updated successfully!', 'success');
        }
      } else {
        const newProduct = {
          id: 'p-' + Date.now(),
          name, category, sackWeightKg, priceSack, priceKilo, stockSacks, openSacks, lowStockThreshold
        };
        products.push(newProduct);
        showToast('New product added to inventory!', 'success');
      }

      saveState();
      closeProductModal();
      renderInventoryTable();
    }

    function editProduct(id) {
      openProductModal(id);
    }

    function deleteProduct(id) {
      if (confirm('Are you sure you want to delete this product from inventory?')) {
        products = products.filter(p => p.id !== id);
        saveState();
        renderInventoryTable();
        showToast('Product removed.', 'info');
      }
    }

    /* --------------------------------------------------
     * 4. UTANG (CREDIT) LEDGER LOGIC
     * -------------------------------------------------- */
    function renderUtangLedger() {
      const container = document.getElementById('utang-ledger-container');
      const search = document.getElementById('utang-search').value.toLowerCase();

      const filtered = utangLedger.filter(u => u.customerName.toLowerCase().includes(search));

      if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs">No credit records found.</div>`;
        return;
      }

      container.innerHTML = filtered.map(u => `
        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-slate-900 text-sm">${u.customerName}</h4>
                <p class="text-[11px] text-slate-500 mt-0.5">📞 ${u.phone || 'No phone recorded'}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.totalBalance > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}">
                ${u.totalBalance > 0 ? 'UNPAID BALANCE' : 'PAID IN FULL'}
              </span>
            </div>

            <div class="mt-3 bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between items-center">
              <span class="text-xs text-slate-600 font-semibold">Total Balance:</span>
              <span class="text-base font-extrabold text-red-600 font-mono">₱${u.totalBalance.toFixed(2)}</span>
            </div>

            <div class="mt-3">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ledger History:</p>
              <div class="text-[11px] text-slate-600 space-y-1 max-h-20 overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded border border-slate-100">
                ${u.history.map(h => `<div>• ${h}</div>`).join('')}
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex gap-2">
            ${u.totalBalance > 0 ? `
              <button onclick="openUtangPayModal('${u.id}')" class="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1">
                💵 Pay Balance
              </button>
            ` : ''}
            <button onclick="deleteUtangRecord('${u.id}')" class="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs font-semibold">
              Delete
            </button>
          </div>
        </div>
      `).join('');
    }

    function openUtangPayModal(utangId) {
      const record = utangLedger.find(u => u.id === utangId);
      if (!record) return;

      currentPayUtangId = utangId;
      document.getElementById('utang-pay-name').innerText = record.customerName;
      document.getElementById('utang-pay-balance').innerText = `₱${record.totalBalance.toFixed(2)}`;
      document.getElementById('utang-pay-amount').value = '';
      document.getElementById('modal-utang-pay').classList.remove('hidden');
    }

    function closeUtangPayModal() {
      document.getElementById('modal-utang-pay').classList.add('hidden');
      currentPayUtangId = null;
    }

    function processUtangPayment() {
      const amount = parseFloat(document.getElementById('utang-pay-amount').value);
      if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid payment amount!', 'error');
        return;
      }

      const record = utangLedger.find(u => u.id === currentPayUtangId);
      if (!record) return;

      if (amount > record.totalBalance) {
        showToast('Payment amount exceeds current balance!', 'error');
        return;
      }

      record.totalBalance -= amount;
      record.lastUpdated = new Date().toISOString();
      record.history.push(`[${new Date().toLocaleDateString()}] Paid: ₱${amount.toFixed(2)} (Bal: ₱${record.totalBalance.toFixed(2)})`);

      saveState();
      closeUtangPayModal();
      renderUtangLedger();
      showToast('Payment recorded successfully!', 'success');
    }

    function openNewUtangModal() {
      document.getElementById('modal-new-utang').classList.remove('hidden');
    }

    function closeNewUtangModal() {
      document.getElementById('modal-new-utang').classList.add('hidden');
    }

    function saveManualUtang(event) {
      event.preventDefault();
      const name = document.getElementById('manual-utang-name').value.trim();
      const phone = document.getElementById('manual-utang-phone').value.trim();
      const amount = parseFloat(document.getElementById('manual-utang-amount').value);
      const notes = document.getElementById('manual-utang-notes').value.trim();

      const existing = utangLedger.find(u => u.customerName.toLowerCase() === name.toLowerCase());

      if (existing) {
        existing.totalBalance += amount;
        existing.history.push(`[${new Date().toLocaleDateString()}] Credit: ₱${amount.toFixed(2)} (${notes || 'Manual Record'})`);
      } else {
        utangLedger.push({
          id: 'u-' + Date.now(),
          customerName: name,
          phone: phone,
          totalBalance: amount,
          lastUpdated: new Date().toISOString(),
          history: [`[${new Date().toLocaleDateString()}] Credit: ₱${amount.toFixed(2)} (${notes || 'Manual Record'})`]
        });
      }

      saveState();
      closeNewUtangModal();
      renderUtangLedger();
      showToast('Credit entry recorded successfully!', 'success');
    }

    function deleteUtangRecord(id) {
      if (confirm('Delete this record from the ledger?')) {
        utangLedger = utangLedger.filter(u => u.id !== id);
        saveState();
        renderUtangLedger();
        showToast('Ledger entry deleted.', 'info');
      }
    }

    /* --------------------------------------------------
     * CASH OUT / EXPENSES LOGIC
     * -------------------------------------------------- */
    function recordCashOut(event) {
      event.preventDefault();
      const category = document.getElementById('cashout-category').value;
      const amount = parseFloat(document.getElementById('cashout-amount').value);
      const remarks = document.getElementById('cashout-remarks').value.trim();

      if (!Number.isFinite(amount) || amount <= 0) {
        showToast('Please enter a valid cash out amount!', 'error');
        return;
      }

      const cashSalesCollected = sales
        .filter(s => s.paymentType === 'Cash')
        .reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
      const creditCollections = utangLedger.reduce((acc, u) => {
        return acc + (u.history || []).reduce((sum, entry) => {
          const match = entry.match(/Paid: ₱([0-9,.]+)/);
          return sum + (match ? Number(match[1].replace(/,/g, '')) : 0);
        }, 0);
      }, 0);
      const currentCash = cashSalesCollected + creditCollections -
        cashOutRecords.reduce((acc, r) => acc + Number(r.amount || 0), 0);

      if (amount > currentCash) {
        showToast('Insufficient cash in drawer for this cash out!', 'error');
        return;
      }

      cashOutRecords.push({
        id: 'CO-' + Date.now(),
        timestamp: new Date().toISOString(),
        category,
        amount,
        remarks
      });

      saveState();
      document.getElementById('cashout-form').reset();
      renderCashOut();
      renderDashboard();
      showToast('Cash out recorded successfully!', 'success');
    }

    function renderCashOut() {
      const categories = {
        'Food Allowance': 'cashout-food-total',
        'Gas Allowance': 'cashout-gas-total',
        'Remit Cash': 'cashout-remit-total',
        'Other Expenses': 'cashout-other-total'
      };

      Object.entries(categories).forEach(([category, elementId]) => {
        const total = cashOutRecords
          .filter(r => r.category === category)
          .reduce((sum, r) => sum + Number(r.amount || 0), 0);
        document.getElementById(elementId).innerText =
          `₱${total.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
      });

      const grandTotal = cashOutRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      document.getElementById('cashout-grand-total').innerText =
        `Total: ₱${grandTotal.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

      const tbody = document.getElementById('cashout-history-body');
      if (cashOutRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">No cash out records yet.</td></tr>`;
      } else {
        tbody.innerHTML = [...cashOutRecords].reverse().map(record => `
          <tr class="hover:bg-slate-50">
            <td class="p-2 text-slate-500">${new Date(record.timestamp).toLocaleString()}</td>
            <td class="p-2 font-semibold text-slate-800">${record.category}</td>
            <td class="p-2 text-slate-600">${record.remarks || '-'}</td>
            <td class="p-2 text-right font-bold font-mono text-red-600">₱${Number(record.amount).toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    /* --------------------------------------------------
     * 5. SALES REPORTS LOGIC
     * -------------------------------------------------- */
    function renderReports() {
      const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const totalCash = sales.filter(s => s.paymentType === 'Cash').reduce((acc, s) => acc + s.totalAmount, 0);
      const totalCredit = sales.filter(s => s.paymentType === 'Utang').reduce((acc, s) => acc + s.totalAmount, 0);

      document.getElementById('report-total-sales').innerText = `₱${totalSales.toLocaleString('en-US', {minimumFractionDigits:2})}`;
      document.getElementById('report-total-cash').innerText = `₱${totalCash.toLocaleString('en-US', {minimumFractionDigits:2})}`;
      document.getElementById('report-total-credit').innerText = `₱${totalCredit.toLocaleString('en-US', {minimumFractionDigits:2})}`;

      const tbody = document.getElementById('sales-report-table-body');
      if (sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">No sales transactions logged yet.</td></tr>`;
      } else {
        tbody.innerHTML = [...sales].reverse().map(s => `
          <tr class="hover:bg-slate-50">
            <td class="p-2 font-mono font-bold text-slate-700">${s.id}</td>
            <td class="p-2 text-slate-500 font-mono text-[11px]">${new Date(s.timestamp).toLocaleString()}</td>
            <td class="p-2 font-medium">${s.customerName}</td>
            <td class="p-2"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${s.paymentType === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">${s.paymentType === 'Utang' ? 'Credit' : s.paymentType}</span></td>
            <td class="p-2 text-slate-600 max-w-xs">
              ${s.items.map(i => {
                const isDiscounted = i.unitPrice < i.originalPrice;
                return `${i.qty} ${i.unitType} ${i.name} (@₱${i.unitPrice})${isDiscounted ? ' <span class="text-red-600 font-bold">[DISC]</span>' : ''}`;
              }).join(', ')}
            </td>
            <td class="p-2 text-right font-bold font-mono text-slate-900">₱${s.totalAmount.toFixed(2)}</td>
          </tr>
        `).join('');
      }

      renderOfflineSummaries(totalSales);
    }

    function renderOfflineSummaries(grandTotal) {
      let feedsTotal = 0;
      let riceTotal = 0;
      let supplementTotal = 0;

      sales.forEach(s => {
        s.items.forEach(i => {
          const prod = products.find(p => p.id === i.productId);
          const cat = prod ? prod.category : 'Feeds';
          const lineTotal = i.unitPrice * i.qty;
          if (cat === 'Feeds') feedsTotal += lineTotal;
          else if (cat === 'Rice') riceTotal += lineTotal;
          else supplementTotal += lineTotal;
        });
      });

      const catContainer = document.getElementById('offline-cat-summary');
      const getPercent = (amt) => grandTotal > 0 ? Math.round((amt / grandTotal) * 100) : 0;

      catContainer.innerHTML = `
        <div>
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>🌾 Feeds Category</span>
            <span class="font-mono">₱${feedsTotal.toFixed(2)} (${getPercent(feedsTotal)}%)</span>
          </div>
          <div class="w-full bg-slate-100 h-2.5 rounded overflow-hidden border border-slate-200">
            <div class="bg-emerald-600 h-full" style="width: ${getPercent(feedsTotal)}%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>🍚 Rice Category</span>
            <span class="font-mono">₱${riceTotal.toFixed(2)} (${getPercent(riceTotal)}%)</span>
          </div>
          <div class="w-full bg-slate-100 h-2.5 rounded overflow-hidden border border-slate-200">
            <div class="bg-amber-500 h-full" style="width: ${getPercent(riceTotal)}%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>💊 Supplements Category</span>
            <span class="font-mono">₱${supplementTotal.toFixed(2)} (${getPercent(supplementTotal)}%)</span>
          </div>
          <div class="w-full bg-slate-100 h-2.5 rounded overflow-hidden border border-slate-200">
            <div class="bg-blue-600 h-full" style="width: ${getPercent(supplementTotal)}%"></div>
          </div>
        </div>
      `;

      const itemCounts = {};
      sales.forEach(s => {
        s.items.forEach(i => {
          itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
        });
      });

      const sortedItems = Object.keys(itemCounts).sort((a,b) => itemCounts[b] - itemCounts[a]).slice(0, 5);
      const maxCount = sortedItems.length > 0 ? itemCounts[sortedItems[0]] : 1;
      const bestContainer = document.getElementById('offline-bestseller-summary');

      if (sortedItems.length === 0) {
        bestContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-2">No sales items logged yet.</p>`;
      } else {
        bestContainer.innerHTML = sortedItems.map(itemName => {
          const qty = itemCounts[itemName];
          const pct = Math.round((qty / maxCount) * 100);
          return `
            <div>
              <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span class="truncate pr-2">${itemName}</span>
                <span class="font-bold text-brand-700 font-mono">${qty} sold</span>
              </div>
              <div class="w-full bg-slate-100 h-2.5 rounded overflow-hidden border border-slate-200">
                <div class="bg-brand-700 h-full" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    /* --------------------------------------------------
     * TOAST NOTIFICATIONS
     * -------------------------------------------------- */
    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');

      let bgColor = 'bg-slate-900';
      let icon = 'ℹ️';

      if (type === 'success') {
        bgColor = 'bg-emerald-800';
        icon = '✓';
      } else if (type === 'error') {
        bgColor = 'bg-red-700';
        icon = '⚠️';
      }

      toast.className = `${bgColor} text-white px-3.5 py-2.5 rounded shadow-lg text-xs font-semibold flex items-center gap-2 transform transition-all duration-200 translate-y-2 opacity-0 pointer-events-auto border border-slate-700`;
      toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      }, 10);

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 200);
      }, 2500);
    }
