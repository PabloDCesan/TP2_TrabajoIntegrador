import express from 'express';
import Controlador from '../controlador/usuarios.js';
import verificarToken from '../servicio/auth.js';
import soloAdmin from '../servicio/rol.js';

class Router {
    #controlador;

    constructor(persistencia) {
        this.#controlador = new Controlador(persistencia);
    }

    start() {
        const router = express.Router();

        router.post('/registro', verificarToken, soloAdmin, this.#controlador.registrar);
        router.post('/login', this.#controlador.login);

        router.get('/', verificarToken, soloAdmin, this.#controlador.listar);
        router.get('/:id', verificarToken, soloAdmin, this.#controlador.verDetalle);
        router.put('/:id/rol', verificarToken, soloAdmin, this.#controlador.cambiarRol);
        router.delete('/:id', verificarToken, soloAdmin, this.#controlador.borrar);

        return router;
    }
}

export default Router;