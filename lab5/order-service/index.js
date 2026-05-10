const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const morgan = require('morgan');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// --- Mongoose Model ---
const orderSchema = new mongoose.Schema({
    customerId: { type: String, required: true },
    items: [
        {
            productId: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'CREATED' } // CREATED, SHIPPED, CANCELLED
});
const Order = mongoose.model('Order', orderSchema);

// --- RabbitMQ Setup ---
let channel;
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue('order_created');
        console.log('Connected to RabbitMQ (Publisher)');
    } catch (error) {
        console.error('RabbitMQ Connection failed, retrying in 5s...', error.message);
        setTimeout(connectRabbitMQ, 5000);
    }
}
connectRabbitMQ();

// --- REST APIs ---
// Tạo Order mới
app.post('/', async (req, res) => {
    try {
        const { customerId, items } = req.body;
        
        // Tính tổng tiền
        const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        
        const order = new Order({
            customerId,
            items,
            totalAmount
        });
        await order.save();

        // Publish event 'order_created'
        if (channel) {
            const eventPayload = {
                _id: order._id,
                customerId: order.customerId,
                items: order.items,
                status: order.status
            };
            channel.sendToQueue('order_created', Buffer.from(JSON.stringify(eventPayload)));
            console.log(`[Order Service] Event 'order_created' published for order: ${order._id}`);
        }

        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lấy danh sách Order
app.get('/', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy Order theo ID
app.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: 'Invalid ID' });
    }
});

// Cập nhật Order (Ví dụ: trạng thái)
app.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Hủy/Xóa Order
app.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Invalid ID' });
    }
});

// --- Startup ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to Order MongoDB');
        app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
