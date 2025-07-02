// servicio/usuarios.js - CORREGIDO
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../model/DAO/models/usuario.js';
import { LibroModel } from '../model/DAO/models/libro.js';
import config from '../config.js';

class Servicio {
    constructor(persistencia) {}

    registrar = async (datos) => {
        const existente = await UsuarioModel.findOne({ email: datos.email });
        if (existente) throw new Error('Usuario ya registrado');

        // Validaciones
        if (!datos.nombre || !datos.email || !datos.password) {
            throw new Error('Todos los campos son requeridos');
        }

        const nuevoUsuario = new UsuarioModel({
            ...datos,
            librosPrestados: [],
            historialPrestamos: []
        });
        
        return await nuevoUsuario.save();
    };

    login = async ({ email, password }) => {
        const usuario = await UsuarioModel.findOne({ email });
        if (!usuario || usuario.password !== password) throw new Error('Credenciales inválidas');

        const token = jwt.sign(
            { id: usuario._id, email: usuario.email, rol: usuario.rol }, 
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        return token;
    };

    listar = async () => {
        return await UsuarioModel.find({}, '-password').populate('librosPrestados.libroId');
    };

    verDetalle = async (id) => {
        const usuario = await UsuarioModel.findById(id, '-password');
        if (!usuario) throw new Error('Usuario no encontrado');
        
        // Obtener información detallada de los libros prestados
        const librosPrestados = await Promise.all(
            usuario.librosPrestados.map(async (prestamo) => {
                const libro = await LibroModel.findById(prestamo.libroId);
                return {
                    libro,
                    fechaPrestamo: prestamo.fechaPrestamo
                };
            })
        );
        
        return {
            ...usuario.toObject(),
            librosPrestadosDetalle: librosPrestados
        };
    };

    cambiarRol = async (id, nuevoRol) => {
        if (!['user', 'admin'].includes(nuevoRol)) {
            throw new Error('Rol inválido');
        }
        
        const usuario = await UsuarioModel.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');
        
        usuario.rol = nuevoRol;
        await usuario.save();
        
        return await this.verDetalle(id);
    };

    borrar = async (id, usuarioActualId) => {
        const usuario = await UsuarioModel.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');
        
        // No permitir auto-eliminación
        if (id === usuarioActualId) {
            throw new Error('No puedes eliminarte a ti mismo');
        }
        
        // Verificar si es admin (cambio aquí)
        if (usuario.rol === 'admin') {
            // Si es el mismo usuario admin
            if (id === usuarioActualId) {
                throw new Error('No puedes eliminarte a ti mismo');
            }
            // Si es otro admin
            throw new Error('No se puede borrar un administrador');
        }
        
        // Verificar que no tenga libros prestados
        if (usuario.librosPrestados.length > 0) {
            throw new Error('El usuario tiene libros prestados. Debe devolverlos antes de eliminar la cuenta');
        }
        
        await UsuarioModel.findByIdAndDelete(id);
        return { mensaje: 'Usuario eliminado correctamente' };
    };

    obtenerMisPrestamos = async (usuarioId) => {
        const usuario = await UsuarioModel.findById(usuarioId);
        if (!usuario) throw new Error('Usuario no encontrado');
        
        const prestamosActuales = await Promise.all(
            usuario.librosPrestados.map(async (prestamo) => {
                const libro = await LibroModel.findById(prestamo.libroId);
                return {
                    libro,
                    fechaPrestamo: prestamo.fechaPrestamo,
                    diasPrestado: Math.ceil((new Date() - prestamo.fechaPrestamo) / (1000 * 60 * 60 * 24))
                };
            })
        );
        
        return {
            prestamosActuales,
            historial: usuario.historialPrestamos,
            totalPrestamosActivos: usuario.librosPrestados.length,
            limitePrestamos: 3
        };
    };
}

export default Servicio;