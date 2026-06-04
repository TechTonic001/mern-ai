const mongoose = require('mongoose');

const TTSJobSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputText: { type: String, required: true, maxlength: 5000 },
  voiceId:   { type: String, required: true },
  settings:  { speed: { type: Number, default: 1 }, pitch: { type: Number, default: 0 } },
  audioUrl:  { type: String },
  format:    { type: String, enum: ['mp3','wav','ogg'], default: 'mp3' },
}, { timestamps: true });

module.exports = mongoose.model('TTSJob', TTSJobSchema);