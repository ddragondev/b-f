import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  imagePath: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Card = mongoose.model('Card', cardSchema);