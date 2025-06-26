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

        router.get('/', this.#controlador.listar);
        router.post('/', verificarToken, soloAdmin, this.#controlador.agregar); // solo admin puede agregar libros
        router.post('/reservar/:id', verificarToken, this.#controlador.reservar);

        return router;
    }
}

export default Router;