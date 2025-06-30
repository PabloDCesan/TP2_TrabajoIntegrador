import express from 'express';
import cors from 'cors';
import RouterUsuarios from './router/usuarios.js';
import RouterLibros from './router/libros.js';
import CnxMongoDB from './model/DBMongo.js';

class Server {
    #port;
    #persistencia;
    #server;

    constructor(port, persistencia) {
        this.#port = port;
        this.#persistencia = persistencia;
        this.#server = null;
    }

    async start() {
        const app = express();

        app.use(cors());

        app.use((req, res, next) => {
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                express.json()(req, res, next);
            } else {
                next();
            }
        });

        app.use('/api/usuarios', new RouterUsuarios(this.#persistencia).start());
        app.use('/api/libros', new RouterLibros(this.#persistencia).start());

        if (this.#persistencia === 'MONGODB') {
            await CnxMongoDB.conectar();
        }

        this.#server = app.listen(this.#port, () => {
            console.log(`Servidor escuchando en http://localhost:${this.#port}`);
        });

        // Devuelvo app y servidor para tests
        return { app, server: this.#server };
    }

    async stop() {
        if (this.#server) {
            this.#server.close();
            await CnxMongoDB.desconectar();
            this.#server = null;
        }
    }
}

export default Server;


export default Server;
