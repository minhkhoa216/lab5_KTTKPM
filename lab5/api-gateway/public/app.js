// Base URL pointing to the API Gateway relative to current host
const API_BASE = window.location.origin;

// State management
let products = [];
let customers = [];
let orders = [];

// DOM Elements
const tabsBtn = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Setup Navigation bindings
    tabsBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            tabsBtn.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = `${btn.getAttribute('data-tab')}-tab`;
            document.getElementById(targetId).classList.add('active');
            
            // Refresh data when switching tabs (realtime feel)
            fetchData();
        });
    });

    // Initial data load
    fetchData();
});

// Fetch all data from microservices via gateway
async function fetchData() {
    try {
        const [prodRes, custRes, ordRes] = await Promise.all([
            fetch(`${API_BASE}/products`),
            fetch(`${API_BASE}/customers`),
            fetch(`${API_BASE}/orders`)
        ]);

        products = await prodRes.json();
        customers = await custRes.json();
        orders = await ordRes.json();

        renderProducts();
        renderCustomers();
        renderOrders();
        populateDropdowns();
    } catch (error) {
        showToast('Error loading data: ' + error.message, 'error');
    }
}

// Render Products
function renderProducts() {
    const list = document.getElementById('products-list');
    if(products.length === 0) {
        list.innerHTML = `<p class="text-muted">No products found. Add some!</p>`;
        return;
    }
    
    list.innerHTML = products.map(p => `
        <div class="card">
            <h4 class="card-title">${p.name}</h4>
            <div class="card-price">$${p.price.toFixed(2)}</div>
            <div class="card-meta">
                <span>Total Sold: N/A</span>
                <span class="badge ${p.inventory <= 5 ? 'low' : ''}">${p.inventory} in stock</span>
            </div>
            <div class="card-meta" style="margin-top: 8px; border:none; padding:0; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.7rem; color: #64748b;">ID: ${p._id}</span>
                <div>
                   <button class="btn btn-sm" onclick="promptUpdateProduct('${p._id}')" style="padding: 2px 6px; font-size: 0.7rem;">Chỉnh sửa (U)</button>
                   <button class="btn btn-sm" onclick="deleteItem('products', '${p._id}')" style="padding: 2px 6px; font-size: 0.7rem; background:rgba(239, 68, 68, 0.2); color:#ef4444;">Xóa (D)</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Customers
function renderCustomers() {
    const list = document.getElementById('customers-list');
    if(customers.length === 0) {
        list.innerHTML = `<p class="text-muted">No customers found.</p>`;
        return;
    }
    
    list.innerHTML = customers.map(c => `
        <div class="list-item">
            <div class="list-item-left">
                <h4>${c.name}</h4>
                <p>${c.email} | ${c.address || 'No address'}</p>
                <p style="font-size: 0.7rem; color: #64748b; margin-top:2px;">ID: ${c._id}</p>
            </div>
            <div class="list-item-right" style="display:flex; gap: 8px; align-items:center;">
                <button class="btn btn-sm" onclick="promptUpdateCustomer('${c._id}')" style="padding: 4px 8px; font-size: 0.75rem;">Chỉnh sửa (U)</button>
                <button class="btn btn-sm" onclick="deleteItem('customers', '${c._id}')" style="padding: 4px 8px; font-size: 0.75rem; background:rgba(239, 68, 68, 0.2); color:#ef4444;">Xóa (D)</button>
            </div>
        </div>
    `).join('');
}

// Render Orders
function renderOrders() {
    const list = document.getElementById('orders-list');
    if(orders.length === 0) {
        list.innerHTML = `<p class="text-muted">No orders placed yet.</p>`;
        return;
    }

    // sort by latest first
    const sorted = [...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    list.innerHTML = sorted.map(o => {
        const c = customers.find(x => x._id === o.customerId);
        const cName = c ? c.name : 'Unknown User';
        return `
        <div class="list-item">
            <div class="list-item-left">
                <h4>Order #${o._id.substring(o._id.length - 6).toUpperCase()}</h4>
                <p>By ${cName} • ${new Date(o.createdAt).toLocaleString()}</p>
                <p class="text-muted mt-2">${o.items.length} items ordered</p>
            </div>
            <div class="list-item-right">
                <h4>$${o.totalAmount.toFixed(2)}</h4>
                <div style="margin-top: 8px; display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                  <span class="badge" style="background:rgba(59,130,246,0.1); color:var(--primary);">${o.status}</span>
                  <button class="btn btn-sm" onclick="deleteItem('orders', '${o._id}')" style="padding: 2px 6px; font-size: 0.7rem; background:rgba(239, 68, 68, 0.1); color:#ef4444; border:none; cursor:pointer;">Hủy Đơn (D)</button>
                </div>
            </div>
        </div>
    `}).join('');
}

// Populate product/customer dropdowns in Order modal
function populateDropdowns() {
    const pSelect = document.getElementById('o-product');
    const cSelect = document.getElementById('o-customer');

    pSelect.innerHTML = `<option value="">-- Select Product --</option>` + 
        products.map(p => `<option value="${p._id}" data-price="${p.price}">${p.name} ($${p.price} - ${p.inventory} instock)</option>`).join('');
        
    cSelect.innerHTML = `<option value="">-- Select Customer --</option>` + 
        customers.map(c => `<option value="${c._id}">${c.name} (${c.email})</option>`).join('');
}

function updateOrderPrice() {
    const sel = document.getElementById('o-product');
    const opt = sel.options[sel.selectedIndex];
    if(opt && opt.dataset.price) {
        document.getElementById('o-price').value = '$' + parseFloat(opt.dataset.price).toFixed(2);
    } else {
        document.getElementById('o-price').value = '';
    }
}

// Modals
function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// Forms Submission
async function handleProductSubmit(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('p-name').value,
        price: parseFloat(document.getElementById('p-price').value),
        inventory: parseInt(document.getElementById('p-inv').value)
    };

    try {
        const res = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            showToast('Product added successfully!', 'success');
            closeModal('product-modal');
            e.target.reset();
            fetchData();
        } else throw new Error(await res.text());
    } catch(err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('c-name').value,
        email: document.getElementById('c-email').value,
        address: document.getElementById('c-address').value
    };

    try {
        const res = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            showToast('Customer added successfully!', 'success');
            closeModal('customer-modal');
            e.target.reset();
            fetchData();
        } else throw new Error(await res.text());
    } catch(err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const cId = document.getElementById('o-customer').value;
    const pId = document.getElementById('o-product').value;
    const qty = parseInt(document.getElementById('o-qty').value);
    
    if(!cId || !pId || !qty || qty <= 0) return showToast('Please fill all fields properly', 'error');
    
    // Find price
    const prod = products.find(p => p._id === pId);

    const payload = {
        customerId: cId,
        items: [
            {
                productId: pId,
                quantity: qty,
                price: prod.price
            }
        ]
    };

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            showToast('Order created! Event sent to RabbitMQ.', 'success');
            closeModal('order-modal');
            e.target.reset();
            document.getElementById('o-price').value = '';
            
            // Re-fetch after 500ms to allow rabbitMQ update inventory
            setTimeout(fetchData, 500);
        } else throw new Error(await res.text());
    } catch(err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Update / DELETE Functions (CRUD Completion)
async function deleteItem(resource, id) {
    if(!confirm('Bạn có chắc chắn muốn xóa không? Hành động này (DELETE API) không thể hoàn tác.')) return;
    try {
        const res = await fetch(`${API_BASE}/${resource}/${id}`, {
            method: 'DELETE'
        });
        if(res.ok || res.status === 204) {
             showToast(`Đã xóa thành công khỏi ${resource}!`, 'success');
             fetchData();
        } else {
             throw new Error("Cannot delete item");
        }
    } catch(err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function promptUpdateProduct(id) {
    const p = products.find(x => x._id === id);
    if(!p) return;
    const newPrice = prompt(`Nhập giá tiền cập nhật cho ${p.name} (PUT API):`, p.price);
    if(newPrice && !isNaN(newPrice)) {
       try {
            await fetch(`${API_BASE}/products/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ price: parseFloat(newPrice) })
            });
            showToast('Chỉnh sửa giá thành công!', 'success');
            fetchData();
       } catch(err) {}
    }
}

async function promptUpdateCustomer(id) {
    const c = customers.find(x => x._id === id);
    if(!c) return;
    const newName = prompt(`Nhập tên mới cập nhật (PUT API):`, c.name);
    if(newName) {
       try {
            await fetch(`${API_BASE}/customers/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name: newName })
            });
            showToast('Chỉnh sửa tên thành công!', 'success');
            fetchData();
       } catch(err) {}
    }
}
