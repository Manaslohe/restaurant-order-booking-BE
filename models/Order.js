const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true
  },
  deliveredAt: {
    type: Date,
    default: Date.now
  },
  note: String,
  deliveredBy: String
});

const orderSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Order type is required'],
    enum: ['regular', 'event']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Regular order fields
  phone: {
    type: String,
    required: function() { return this.type === 'regular'; }
  },
  name: {
    type: String,
    required: function() { return this.type === 'regular'; }
  },
  thaliCount: {
    type: Number,
    required: function() { return this.type === 'regular'; },
    min: [1, 'Thali count must be at least 1']
  },
  
  // Event order fields
  eventName: {
    type: String,
    required: function() { return this.type === 'event'; }
  },
  bookerName: {
    type: String,
    required: function() { return this.type === 'event'; }
  },
  mobileNumber: {
    type: String,
    required: function() { return this.type === 'event'; }
  },
  guestCount: {
    type: Number,
    required: function() { return this.type === 'event'; },
    min: [1, 'Guest count must be at least 1']
  },
  date: {
    type: Date,
    required: function() { return this.type === 'event'; }
  },
  time: {
    type: String,
    required: function() { return this.type === 'event'; }
  },
  
  deliveredThalis: [deliverySchema],
  remainingThalis: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partially_delivered', 'completed'],
    default: 'pending'
  },
  lastDeliveryAt: Date,
  totalDelivered: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update the pre-save middleware
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.remainingThalis = this.type === 'regular' ? this.thaliCount : this.guestCount;
    this.totalDelivered = 0;
  }
  if (this.deliveredThalis.length > 0) {
    this.lastDeliveryAt = this.deliveredThalis[this.deliveredThalis.length - 1].deliveredAt;
    this.totalDelivered = this.deliveredThalis.reduce((sum, delivery) => sum + delivery.quantity, 0);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
