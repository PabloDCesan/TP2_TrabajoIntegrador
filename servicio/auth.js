import jwt from 'jsonwebtoken';
import config from '../config.js';

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'Token requerido' });

    // Extraer el token del header "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido' });
    }
};

export default verificarToken;
