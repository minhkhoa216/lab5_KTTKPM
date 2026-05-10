async function seed() {
    console.log("Seeding data...");
    
    try {
        // Products
        await fetch('http://localhost:8080/products', { method: 'POST', body: JSON.stringify({ name: 'MacBook Air M2', price: 1199, inventory: 15 }), headers: { 'Content-Type': 'application/json' }});
        await fetch('http://localhost:8080/products', { method: 'POST', body: JSON.stringify({ name: 'Dell XPS 13 Plus', price: 1299, inventory: 10 }), headers: { 'Content-Type': 'application/json' }});
        await fetch('http://localhost:8080/products', { method: 'POST', body: JSON.stringify({ name: 'Logitech MX Master 3', price: 99, inventory: 50 }), headers: { 'Content-Type': 'application/json' }});
        await fetch('http://localhost:8080/products', { method: 'POST', body: JSON.stringify({ name: 'Keychron K3 Pro', price: 109, inventory: 30 }), headers: { 'Content-Type': 'application/json' }});
        await fetch('http://localhost:8080/products', { method: 'POST', body: JSON.stringify({ name: 'Samsung 34 inch Ultrawide', price: 549, inventory: 5 }), headers: { 'Content-Type': 'application/json' }});
        
        // Customers
        await fetch('http://localhost:8080/customers', { method: 'POST', body: JSON.stringify({ name: 'Le Trong C', email: 'c.letrong@example.com', address: 'Da Nang' }), headers: { 'Content-Type': 'application/json' }});
        await fetch('http://localhost:8080/customers', { method: 'POST', body: JSON.stringify({ name: 'Pham Nhat D', email: 'd.pham@example.com', address: 'Hai Phong' }), headers: { 'Content-Type': 'application/json' }});
        await fetch('http://localhost:8080/customers', { method: 'POST', body: JSON.stringify({ name: 'Steve Jobs', email: 'steve@apple.com', address: 'California' }), headers: { 'Content-Type': 'application/json' }});
        await fetch('http://localhost:8080/customers', { method: 'POST', body: JSON.stringify({ name: 'Jensen Huang', email: 'jensen@nvidia.com', address: 'Santa Clara' }), headers: { 'Content-Type': 'application/json' }});

        console.log("Data seeded successfully!");
    } catch(err) {
        console.error("Failed:", err);
    }
}

seed();
