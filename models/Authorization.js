const mongoose = require('mongoose');
const { MongoClient, MongoClientFactory, STATE } = require('../components/MongoClient');
const FREEZE_TIME = (process.env.TOKEN_FREEZE || 8 * 60 * 60) * 1000;

const STATUS = {
  VALID: 1,
  EXPIRED: 0
};

const authorizationSchema = new mongoose.Schema({
  brand: {
    type: String
  },
  city: {
    type: String
  },
  phone_source: {
    type: String
  },
  phone_country: String,
  phone_num: String,
  emai: String,
  token: String,
  status: Number,
  freeze_to: Date
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

authorizationSchema.statics.findValiTokensByBrand = async function (brand) {
  if (MongoClient.readyState === STATE.DISCONNECTED) {
    await MongoClientFactory.reconnect();
  }
  const docs = await this.find({
    brand,
    status: STATUS.VALID,
    $or: [{ freeze_to: { $exists: false } }, { freeze_to: { $lt: new Date() } }]
  }, { token: 1, _id: 0 }).exec();
  return docs.map(doc => doc.token);
};

authorizationSchema.statics.expireToken = async function (token) {
  return this.update({ token, status: STATUS.VALID }, { $set: { status: STATUS.EXPIRED } }, { multi: true }).exec();
};

authorizationSchema.statics.freezeToken = async function (token) {
  const freeze_to = new Date(Date.now() + FREEZE_TIME);
  return this.update({ token, status: STATUS.VALID }, { $set: { freeze_to } }, { multi: true }).exec();
};

module.exports = mongoose.model('Authorizaton', authorizationSchema);
