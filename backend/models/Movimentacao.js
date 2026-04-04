const mongoose = require('mongoose');

const movimentacaoSchema = new mongoose.Schema({
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tipo: { type: String, enum: ['entrada', 'saida'], required: true },
  origem: { type: String, enum: ['manual', 'venda', 'cancelamento'], default: 'manual' },
  quantidade: { type: Number, required: true, min: 1 },
  data: { type: Date, default: Date.now }
});

movimentacaoSchema.index({ produtoId: 1 });
movimentacaoSchema.index({ userId: 1 });
movimentacaoSchema.index({ data: -1 });

module.exports = mongoose.model('Movimentacao', movimentacaoSchema);
