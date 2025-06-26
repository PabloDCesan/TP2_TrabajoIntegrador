import { LibroModel } from '../model/DAO/models/libro.js';
import { UsuarioModel } from '../model/DAO/models/usuario.js';

class Servicio {
    constructor(persistencia) {
        // Solo MongoDB por ahora
    }

    listar = async () => {
        return await LibroModel.find();
    };

    agregar = async (libro) => {
        if (!libro.titulo || !libro.autor || typeof libro.stock !== 'number') {
            throw new Error('Faltan campos requeridos o formato incorrecto');
        }
        return await LibroModel.create(libro);
    };

    reservar = async (usuarioInfo, libroId) => {
        const usuario = await UsuarioModel.findById(usuarioInfo.id);
        if (!usuario) throw new Error('Usuario no encontrado');

        if (usuario.librosPrestados.length >= 3) {
            throw new Error('Ya tienes 3 libros prestados');
        }

        const libro = await LibroModel.findById(libroId);
        if (!libro || libro.stock <= 0) throw new Error('Libro no disponible');

        libro.stock -= 1;
        await libro.save();

        usuario.librosPrestados.push(libroId);
        await usuario.save();

        return libro;
    };
}

export default Servicio;