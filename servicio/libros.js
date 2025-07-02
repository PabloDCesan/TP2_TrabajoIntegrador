import { LibroModel } from '../model/DAO/models/libro.js';
import { UsuarioModel } from '../model/DAO/models/usuario.js';
import enviarEmailReserva from '../Utils/email.js';
import enviarEmailDevolucion from '../Utils/emailDevolucion.js';

class Servicio {
    constructor(persistencia) {
        // Solo MongoDB por ahora
    }

    listar = async () => {
        return await LibroModel.find();
    };

    obtenerPorId = async (id) => {
        const libro = await LibroModel.findById(id);
        if (!libro) throw new Error('Libro no encontrado');
        return libro;
    };

    agregar = async (libro) => {
        if (!libro.titulo || !libro.autor || typeof libro.stock !== 'number') {
            throw new Error('Faltan campos requeridos o formato incorrecto');
        }

        // NUEVA VALIDACIÓN: Verificar si ya existe un libro con mismo título y autor
        const libroExistente = await LibroModel.findOne({
            titulo: libro.titulo,
            autor: libro.autor
        });

        if (libroExistente) {
            throw new Error(`Ya existe un libro con título "${libro.titulo}" y autor "${libro.autor}". Si deseas agregar más copias, actualiza el stock del libro existente.`);
        }

        // Al agregar un libro nuevo, el stock total es igual al stock inicial
        libro.stockTotal = libro.stock;
        libro.prestados = 0;

        return await LibroModel.create(libro);
    };
    actualizar = async (id, datosActualizados) => {
        const libro = await LibroModel.findById(id);
        if (!libro) throw new Error('Libro no encontrado');

        // NUEVA VALIDACIÓN: Si se está cambiando título o autor, verificar que no exista otro libro igual
        if (datosActualizados.titulo || datosActualizados.autor) {
            const tituloNuevo = datosActualizados.titulo || libro.titulo;
            const autorNuevo = datosActualizados.autor || libro.autor;

            const libroExistente = await LibroModel.findOne({
                _id: { $ne: id }, // Excluir el libro actual
                titulo: tituloNuevo,
                autor: autorNuevo
            });

            if (libroExistente) {
                throw new Error(`Ya existe otro libro con título "${tituloNuevo}" y autor "${autorNuevo}".`);
            }
        }

        // Si se actualiza el stock total, ajustar el stock disponible
        if (datosActualizados.stockTotal !== undefined) {
            const diferencia = datosActualizados.stockTotal - libro.stockTotal;
            datosActualizados.stock = libro.stock + diferencia;
        }

        const actualizado = await LibroModel.findByIdAndUpdate(
            id,
            datosActualizados,
            { new: true, runValidators: true }
        );

        return actualizado;
    };

    eliminar = async (id) => {
        const libro = await LibroModel.findById(id);
        if (!libro) throw new Error('Libro no encontrado');

        if (libro.prestados > 0) {
            throw new Error(`No se puede eliminar. Hay ${libro.prestados} copias prestadas`);
        }

        await LibroModel.findByIdAndDelete(id);
        return { mensaje: 'Libro eliminado correctamente' };
    };

    reservar = async (usuarioInfo, libroId) => {
        const usuario = await UsuarioModel.findById(usuarioInfo.id);
        if (!usuario) throw new Error('Usuario no encontrado');

        if (usuario.librosPrestados.length >= 3) {
            throw new Error('Ya tienes 3 libros prestados. Debes devolver alguno antes de reservar más.');
        }

        // Verificar si ya tiene este libro
        const yaLoTiene = usuario.librosPrestados.some(p => p.libroId === libroId);
        if (yaLoTiene) {
            throw new Error('Ya tienes una copia de este libro');
        }

        const libro = await LibroModel.findById(libroId);
        if (!libro) throw new Error('Libro no encontrado');

        if (libro.stock <= 0) {
            throw new Error(`No hay copias disponibles. ${libro.prestados} de ${libro.stockTotal} están prestadas`);
        }

        // Actualizar libro
        libro.stock -= 1;
        await libro.save();

        // Agregar a libros prestados del usuario
        usuario.librosPrestados.push({
            libroId: libroId,
            fechaPrestamo: new Date()
        });
        await usuario.save();

        // Enviar notificación por mail
        await enviarEmailReserva(usuario, libro);

        return {
            mensaje: 'Libro reservado exitosamente',
            libro: libro,
            fechaPrestamo: new Date()
        };
    };

    devolver = async (usuarioInfo, libroId) => {
        const usuario = await UsuarioModel.findById(usuarioInfo.id);
        if (!usuario) throw new Error('Usuario no encontrado');

        // Buscar el préstamo
        const prestamoIndex = usuario.librosPrestados.findIndex(p => p.libroId === libroId);
        if (prestamoIndex === -1) {
            throw new Error('No tienes este libro prestado');
        }

        const libro = await LibroModel.findById(libroId);
        if (!libro) throw new Error('Libro no encontrado');

        // Obtener información del préstamo antes de eliminarlo
        const prestamo = usuario.librosPrestados[prestamoIndex];
        prestamo.fechaDevolucion = new Date();

        // Actualizar libro
        libro.stock += 1;
        await libro.save();

        // Mover a historial y eliminar de prestados
        usuario.historialPrestamos.push(prestamo);
        usuario.librosPrestados.splice(prestamoIndex, 1);
        await usuario.save();

        // Enviar notificación
        await enviarEmailDevolucion(usuario, libro);

        return {
            mensaje: 'Libro devuelto correctamente',
            libro: libro,
            diasPrestado: Math.ceil((prestamo.fechaDevolucion - prestamo.fechaPrestamo) / (1000 * 60 * 60 * 24))
        };
    };

    // Estadísticas útiles
    obtenerEstadisticas = async () => {
        const libros = await LibroModel.find();
        const usuarios = await UsuarioModel.find();

        const totalLibros = libros.reduce((sum, libro) => sum + libro.stockTotal, 0);
        const librosPrestados = libros.reduce((sum, libro) => sum + libro.prestados, 0);
        const librosDisponibles = libros.reduce((sum, libro) => sum + libro.stock, 0);

        return {
            totalLibros,
            librosPrestados,
            librosDisponibles,
            totalUsuarios: usuarios.length,
            usuariosConPrestamos: usuarios.filter(u => u.librosPrestados.length > 0).length
        };
    };
}

export default Servicio;