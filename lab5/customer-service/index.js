const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/customer_db';

// --- Mongoose Model ---
const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: String,
    phone: String,
    email: { type: String, required: true }
});
const Customer = mongoose.model('Customer', customerSchema);

// --- REST APIs ---
// Tạo Customer mới
app.post('/', async (req, res) => {
    try {
        const customer = new Customer(req.body);
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lấy danh sách Customer
app.get('/', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy Customer theo ID
app.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(400).json({ error: 'Invalid ID' });
    }
});

// Cập nhật Customer
app.put('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Xóa Customer
app.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Invalid ID' });
    }
});

// --- Startup ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to Customer MongoDB');
        app.listen(PORT, () => console.log(`Customer Service running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
