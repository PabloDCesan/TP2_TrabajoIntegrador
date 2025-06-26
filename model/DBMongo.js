import config from '../config.js';
import mongoose from 'mongoose';

class CnxMongoDB {
    static connectionOK = false;

    static async conectar() {
        try {
            console.log('Conectando a MongoDB...');
            await mongoose.connect(`${config.STRCNX}/${config.BASE}`);
            console.log('Base de datos conectada.');
            CnxMongoDB.connectionOK = true;
        } catch (error) {
            console.log(`Error conectando a MongoDB: ${error.message}`);
        }
    }

    static async desconectar() {
        if (!CnxMongoDB.connectionOK) return;
        await mongoose.connection.close();
        CnxMongoDB.connectionOK = false;
    }
}

export default CnxMongoDB;