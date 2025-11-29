const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: products
app.get('/api/products', (req, res) => {
	const dataPath = path.join(__dirname, 'data', 'products.json');
	fs.readFile(dataPath, 'utf8', (err, json) => {
		if (err) return res.status(500).json({ error: 'Failed to load products' });
		res.json(JSON.parse(json));
	});
});

// API: artists
app.get('/api/artists', (req, res) => {
	const artistsPath = path.join(__dirname, 'data', 'artists.json');
	fs.readFile(artistsPath, 'utf8', (err, json) => {
		if (err) return res.status(500).json({ error: 'Failed to load artists' });
		res.json(JSON.parse(json));
	});
});

// API: checkout (simple simulation)
app.post('/api/checkout', (req, res) => {
	const { cart, customer } = req.body;
	if (!cart || cart.length === 0) {
		return res.status(400).json({ error: 'Cart is empty' });
	}
	// simple order id generation
	const orderId = 'ORD-' + Math.random().toString(36).slice(2, 10).toUpperCase();
	// In a real app you'd store the order and process payment
	res.json({ success: true, orderId });
});

app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});
