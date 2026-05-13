const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: [true, 'Business name is required'], trim: true },
  description: { type: String, maxlength: [1000, 'Description cannot exceed 1000 chars'] },
  website: String,
  logo: String,
  coverImage: String,
  businessType: { type: String, enum: ['individual', 'company', 'nonprofit'], default: 'individual' },
  verificationStatus: { type: String, enum: ['pending', 'under_review', 'verified', 'rejected'], default: 'pending' },
  verificationDocuments: [{ docType: String, docUrl: String, uploadedAt: Date }],
  verificationBadge: { type: Boolean, default: false },
  verifiedAt: Date,
  bankDetails: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    stripeAccountId: String,
  },
  address: { street: String, city: String, state: String, zipCode: String, country: String },
  socialLinks: { facebook: String, twitter: String, instagram: String, linkedin: String },
  totalAuctions: { type: Number, default: 0 },
  activeAuctions: { type: Number, default: 0 },
  completedAuctions: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  pendingRevenue: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followerCount: { type: Number, default: 0 },
  categories: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  commissionRate: { type: Number, default: 10, min: 0, max: 50 }, // percentage
  joinedAt: { type: Date, default: Date.now },
  lastActive: Date,
  tags: [String],
  policiesAgreed: { type: Boolean, default: false },
  policiesAgreedAt: Date,
}, { timestamps: true });

sellerSchema.index({ user: 1 }, { unique: true }); // unique already in schema, just keep this
sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ rating: -1 });
sellerSchema.index({ totalRevenue: -1 });
sellerSchema.index({ createdAt: -1 });

sellerSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.bankDetails;
  return obj;
};

module.exports = mongoose.model('Seller', sellerSchema);
