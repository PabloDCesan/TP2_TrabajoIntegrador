import mongoose from 'mongoose';


const libroSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    autor: { type: String, required: true },
    isbn: String,
    editorial: String,
    año: Number,
    stock: { type: Number, default: 0 },
    stockTotal: { type: Number, default: 0 },
    prestados: { type: Number, default: 0 }
}, {
    versionKey: false,
    timestamps: true
});
// genera un index unico para no permitir duplicados 
libroSchema.index({ titulo: 1, autor: 1 }, { unique: true });
// Middleware para mantener consistencia
libroSchema.pre('save', function (next) {
    this.prestados = this.stockTotal - this.stock;
    next();
});

export const LibroModel = mongoose.model('libros', libroSchema);