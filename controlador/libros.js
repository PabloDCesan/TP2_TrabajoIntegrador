import Servicio from '../servicio/libros.js';

class Controlador {
    #servicio;

    constructor(persistencia) {
        this.#servicio = new Servicio(persistencia);
    }

    listar = async (req, res) => {
        const libros = await this.#servicio.listar();
        res.json(libros);
    };

    agregar = async (req, res) => {
        try {
            const nuevo = await this.#servicio.agregar(req.body);
            res.json(nuevo);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    reservar = async (req, res) => {
        try {
            const libro = await this.#servicio.reservar(req.usuario, req.params.id);
            res.json(libro);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
}

export default Controlador;