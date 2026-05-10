const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(morgan('dev'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Services definition
const SERVICES = {
    products: 'http://product-service:3000',
    orders: 'http://order-service:3000',
    customers: 'http://customer-service:3000'
};

// Setup proxies
app.use('/products', createProxyMiddleware({
    target: SERVICES.products,
    changeOrigin: true
}));

app.use('/orders', createProxyMiddleware({
    target: SERVICES.orders,
    changeOrigin: true
}));

app.use('/customers', createProxyMiddleware({
    target: SERVICES.customers,
    changeOrigin: true
}));

// Health check root
app.get('/', (req, res) => {
    res.json({
        message: 'API Gateway is running',
        endpoints: ['/products', '/orders', '/customers']
    });
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
