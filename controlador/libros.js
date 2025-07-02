import Servicio from '../servicio/libros.js';

class Controlador {
    #servicio;

    constructor(persistencia) {
        this.#servicio = new Servicio(persistencia);
    }

    listar = async (req, res) => {
        try {
            const libros = await this.#servicio.listar();
            res.json(libros);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
    obtenerPorId = async (req, res) => {
        try {
            const libro = await this.#servicio.obtenerPorId(req.params.id);
            res.json(libro);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    };

    agregar = async (req, res) => {
        try {
            const nuevo = await this.#servicio.agregar(req.body);
            res.status(201).json(nuevo); // Cambia a 201
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
    actualizar = async (req, res) => {
        try {
            const actualizado = await this.#servicio.actualizar(req.params.id, req.body);
            res.json(actualizado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
    eliminar = async (req, res) => {
        try {
            const resultado = await this.#servicio.eliminar(req.params.id);
            res.json(resultado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
    reservar = async (req, res) => {
        try {
            const libro = await this.#servicio.reservar(req.usuario, req.params.id);
            res.status(200).json(libro);
        } catch (error) {
  
            if (error.message.includes('Ya tienes')) {
                res.status(400).json({ error: error.message });
            } else if (error.message.includes('No hay copias')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(404).json({ error: error.message });
            }
        }
    };
    devolver = async (req, res) => {
        try {
            const resultado = await this.#servicio.devolver(req.usuario, req.params.id);
            res.json(resultado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    estadisticas = async (req, res) => {
        try {
            const stats = await this.#servicio.obtenerEstadisticas();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

export default Controlador;