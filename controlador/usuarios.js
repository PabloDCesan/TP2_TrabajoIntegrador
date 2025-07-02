import Servicio from '../servicio/usuarios.js';

class Controlador {
    #servicio;

    constructor(persistencia) {
        this.#servicio = new Servicio(persistencia);
    }

    registrar = async (req, res) => {
        try {
            const usuario = await this.#servicio.registrar(req.body);
            res.status(201).json(usuario); // Cambiar a 201
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    login = async (req, res) => {
        try {
            const token = await this.#servicio.login(req.body);
            res.json({ token });
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    };

    listar = async (req, res) => {
        try {
            const usuarios = await this.#servicio.listar();
            res.json(usuarios);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    verDetalle = async (req, res) => {
        try {
            const usuario = await this.#servicio.verDetalle(req.params.id);
            res.json(usuario);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    };
    cambiarRol = async (req, res) => {
        try {
            const actualizado = await this.#servicio.cambiarRol(req.params.id, req.body.rol);
            res.json(actualizado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    borrar = async (req, res) => {
        try {
            const resultado = await this.#servicio.borrar(req.params.id);
            res.json(resultado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
    misPrestamos = async (req, res) => {
        try {
            const prestamos = await this.#servicio.obtenerMisPrestamos(req.usuario.id);
            res.json(prestamos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

export default Controlador;