const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const morgan = require('morgan');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// --- Mongoose Model ---
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    inventory: { type: Number, default: 0 }
});
const Product = mongoose.model('Product', productSchema);

// --- RabbitMQ Setup ---
let channel;
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue('order_created');
        
        // Lắng nghe Message order_created từ RabbitMQ để cập nhật số lượng tồn kho
        channel.consume('order_created', async (msg) => {
            if (msg !== null) {
                const orderData = JSON.parse(msg.content.toString());
                console.log(`[Product Service] Received order_created event for order: ${orderData._id}`);
                
                if (orderData.items && Array.isArray(orderData.items)) {
                    for (const item of orderData.items) {
                        try {
                            await Product.findByIdAndUpdate(item.productId, {
                                $inc: { inventory: -item.quantity }
                            });
                            console.log(`[Product Service] Reduced inventory for product ${item.productId} by ${item.quantity}`);
                        } catch (err) {
                            console.error(`[Product Service] Error updating inventory for ${item.productId}:`, err.message);
                        }
                    }
                }
                // Xác nhận (acknowledge) tin nhắn đã được xử lý
                channel.ack(msg);
            }
        });
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('RabbitMQ Connection failed, retrying in 5s...', error.message);
        setTimeout(connectRabbitMQ, 5000);
    }
}

connectRabbitMQ();

// --- REST APIs ---
// Tạo sản phẩm mới
app.post('/', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Lấy danh sách sản phẩm
app.get('/', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// Lấy sản phẩm theo ID
app.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: 'Invalid ID' });
    }
});

// Cập nhật sản phẩm
app.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Xóa sản phẩm
app.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Invalid ID' });
    }
});

// --- Startup ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to Product MongoDB');
        app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
