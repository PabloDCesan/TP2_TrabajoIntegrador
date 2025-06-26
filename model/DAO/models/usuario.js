import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    nombre: String,
    email: String,
    password: String,
    rol: { type: String, default: 'user' },
    librosPrestados: [String]
}, { versionKey: false });

export const UsuarioModel = mongoose.model('usuarios', usuarioSchema);
