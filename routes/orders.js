const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Debug logging for routes
router.use((req, res, next) => {
  console.log('Orders Route:', req.method, req.originalUrl);
  next();
});

// Create new order
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    const { type, name, phone, thaliCount, eventName, bookerName, guestCount, date, time } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Order type is required' });
    }

    if (type === 'regular') {
      if (!name || !phone || !thaliCount) {
        return res.status(400).json({ 
          message: 'Name, phone and thali count are required for regular orders' 
        });
      }
    } else if (type === 'event') {
      if (!eventName || !bookerName || !guestCount || !date || !time) {
        return res.status(400).json({ 
          message: 'Event name, booker name, guest count, date and time are required for event orders' 
        });
      }
    }

    const order = new Order({
      ...req.body,
      remainingThalis: type === 'regular' ? thaliCount : guestCount,
      status: 'pending',
      deliveredThalis: [],
      totalDelivered: 0
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add delivery for an order
router.post('/:id/deliver', async (req, res) => {
  try {
    const { quantity, note, deliveredBy } = req.body;
    const deliveryQuantity = parseInt(quantity);
    
    if (isNaN(deliveryQuantity) || deliveryQuantity < 1) {
      return res.status(400).json({ message: 'Invalid delivery quantity' });
    }

    if (!deliveredBy?.trim()) {
      return res.status(400).json({ message: 'Delivered by is required' });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Current remaining thalis:', order.remainingThalis);
    console.log('Attempting to deliver:', deliveryQuantity);

    if (order.remainingThalis < deliveryQuantity) {
      return res.status(400).json({ 
        message: `Cannot deliver ${deliveryQuantity} thalis. Only ${order.remainingThalis} remaining.` 
      });
    }

    // Add the delivery record
    order.deliveredThalis.push({ 
      quantity: deliveryQuantity, 
      note: note?.trim() || '',
      deliveredBy: deliveredBy.trim(),
      deliveredAt: new Date() 
    });
    
    // Update remaining count and status
    order.remainingThalis = order.remainingThalis - deliveryQuantity;
    order.status = order.remainingThalis === 0 ? 'completed' : 'partially_delivered';
    order.totalDelivered = (order.totalDelivered || 0) + deliveryQuantity;

    const updatedOrder = await order.save();
    console.log('Updated remaining thalis:', updatedOrder.remainingThalis);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Delivery error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
