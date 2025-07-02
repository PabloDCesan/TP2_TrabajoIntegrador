import express from 'express';
import Controlador from '../controlador/libros.js';
import verificarToken from '../servicio/auth.js';
import soloAdmin from '../servicio/rol.js';

class Router {
    #controlador;

    constructor(persistencia) {
        this.#controlador = new Controlador(persistencia);
    }

    start() {
      const router = express.Router();

        // Rutas públicas
        router.get('/', this.#controlador.listar);
        router.get('/estadisticas', this.#controlador.estadisticas);
        router.get('/:id', this.#controlador.obtenerPorId);

        // Rutas protegidas - Admin
        router.post('/', verificarToken, soloAdmin, this.#controlador.agregar);
        router.put('/:id', verificarToken, soloAdmin, this.#controlador.actualizar);
        router.delete('/:id', verificarToken, soloAdmin, this.#controlador.eliminar);

        // Rutas protegidas - Usuarios
        router.post('/reservar/:id', verificarToken, this.#controlador.reservar);
        router.post('/devolver/:id', verificarToken, this.#controlador.devolver);

        return router;
    }
}

export default Router;