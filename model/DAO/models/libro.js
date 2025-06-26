import mongoose from 'mongoose';

const libroSchema = new mongoose.Schema({
    titulo: String,
    autor: String,
    stock: Number
}, { versionKey: false });

export const LibroModel = mongoose.model('libros', libroSchema);
