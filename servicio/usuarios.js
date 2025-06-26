import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../model/DAO/models/usuario.js';
import config from '../config.js';

class Servicio {
    constructor(persistencia) {}

    registrar = async (datos) => {
        const existente = await UsuarioModel.findOne({ email: datos.email });
        if (existente) throw new Error('Usuario ya registrado');

        const nuevoUsuario = new UsuarioModel(datos);
        return await nuevoUsuario.save();
    };

    login = async ({ email, password }) => {
        const usuario = await UsuarioModel.findOne({ email });
        if (!usuario || usuario.password !== password) throw new Error('Credenciales inválidas');

        const token = jwt.sign({ id: usuario._id, email: usuario.email, rol: usuario.rol }, config.JWT_SECRET);
        return token;
    };

    listar = async () => {
        return await UsuarioModel.find({}, '-password');
    };

    verDetalle = async (id) => {
        return await UsuarioModel.findById(id, '-password');
    };

    cambiarRol = async (id, nuevoRol) => {
        if (!['user', 'admin'].includes(nuevoRol)) {
            throw new Error('Rol inválido');
        }
        await UsuarioModel.updateOne({ _id: id }, { rol: nuevoRol });
        return await this.verDetalle(id);
    };
}

export default Servicio;