import mongoose from 'mongoose';


const prestamosSchema = new mongoose.Schema({
    libroId: { type: String, required: true },
    fechaPrestamo: { type: Date, default: Date.now },
    fechaDevolucion: Date
});

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'user', enum: ['user', 'admin'] },
    librosPrestados: [prestamosSchema],
    historialPrestamos: [prestamosSchema]
}, { 
    versionKey: false,
    timestamps: true 
});

export const UsuarioModel = mongoose.model('usuarios', usuarioSchema);