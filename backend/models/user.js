const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 3 },
  mobile: { type: String }, 
  gender: { type: String },
  type: { type: String }, 
  address: { type: String }, 
  city: { type: String }, 
  state: { type: String },  
  Url: { type: String },  
  datetime: { type: String },
  resetToken: { type: String },
  expireToken: { type: Date }
}, { timestamps: true });


userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
