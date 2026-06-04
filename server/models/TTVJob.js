const mongoose = require('mongoose');

const TTVJobSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompt:        { type: String, required: true, maxlength: 2000 },
  style:         { type: String, enum: ['cinematic','cartoon','photorealistic','animated'], default: 'cinematic' },
  duration:      { type: Number, default: 5, min: 1, max: 60 },
  status:        { type: String, enum: ['queued','processing','done','failed'], default: 'queued' },
  providerJobId: { type: String },
  videoUrl:      { type: String },
  errorMessage:  { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TTVJob', TTVJobSchema);