const soloAdmin = (req, res, next) => {
    if (req.usuario?.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso solo permitido a administradores' });
    }
    next();
};

export default soloAdmin;
