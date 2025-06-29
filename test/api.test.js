import { expect } from "chai";
import request from "supertest";
import { faker } from "@faker-js/faker";
import Server from "../server.js";
import CnxMongoDB from "../model/DBMongo.js";
import { UsuarioModel } from "../model/DAO/models/usuario.js";
import { LibroModel } from "../model/DAO/models/libro.js";

let app;
let serverInstance;
let tokenAdmin = '';
let tokenUser = '';
let libroId = '';

describe('Pruebas completas de API de usuarios y libros', () => {
    before(async () => {
        try {
          console.log('Conectando a MongoDB...');
          await CnxMongoDB.conectar();
          console.log('Mongo conectado');
      
          console.log('Limpiando colecciones...');
          await UsuarioModel.deleteMany({});
          await LibroModel.deleteMany({});
          console.log('Colecciones limpias');
      
          console.log('Iniciando servidor...');
          const server = new Server(0, 'MONGODB');
          const started = await server.start();
          app = started.app;
          serverInstance = started.server;
          console.log('Servidor iniciado');
        } catch (error) {
          console.error('Error en before:', error);
          throw error;
        }
      });
      

  after(async () => {
    if (serverInstance) serverInstance.close();
    await CnxMongoDB.desconectar();
  });

  it('Debe registrar un admin', async () => {
    const admin = {
      nombre: 'Admin',
      email: 'admin@test.com',
      password: 'admin123',
      rol: 'admin'
    };
    await UsuarioModel.create(admin);
  });

  it('Debe loguear el admin y obtener token', async () => {
    const res = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'admin@test.com', password: 'admin123' });

    expect(res.status).to.equal(200);
    expect(res.body.token).to.be.a('string');
    tokenAdmin = res.body.token;
  });

  it('Debe crear un libro con token de admin', async () => {
    const libro = {
      titulo: faker.lorem.words(3),
      autor: faker.person.fullName(),
      stock: 2
    };

    const res = await request(app)
      .post('/api/libros')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(libro);

    expect(res.status).to.be.oneOf([200, 201]);
    libroId = res.body._id || res.body.id;
  });

  it('Debe registrar un usuario común', async () => {
    const nuevoUsuario = {
      nombre: 'Usuario',
      email: 'user@test.com',
      password: 'user123'
    };

    const res = await request(app)
      .post('/api/usuarios/registro')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(nuevoUsuario);

    expect(res.status).to.be.oneOf([200, 201]);
    expect(res.body.email).to.equal('user@test.com');
  });

  it('Debe loguear el usuario y obtener token', async () => {
    const res = await request(app)
      .post('/api/usuarios/login')
      .send({ email: 'user@test.com', password: 'user123' });

    expect(res.status).to.equal(200);
    tokenUser = res.body.token;
  });

  it('Debe reservar el libro como usuario', async () => {
    const res = await request(app)
      .post(`/api/libros/reservar/${libroId}`)
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).to.equal(200);
    expect(res.body._id).to.equal(libroId);
  });
});
