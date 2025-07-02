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
let usuarioId = '';

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

  describe('Autenticación y Usuarios', () => {
    it('Debe crear un admin inicial directamente', async () => {
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

    it('Debe registrar un usuario común', async () => {
      const nuevoUsuario = {
        nombre: faker.person.fullName(),
        email: 'user@test.com',
        password: 'user123'
      };

      const res = await request(app)
        .post('/api/usuarios/registro')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(nuevoUsuario);

      expect(res.status).to.equal(201);
      expect(res.body.email).to.equal('user@test.com');
      expect(res.body.rol).to.equal('user');
      usuarioId = res.body._id;
    });

    it('Debe permitir registro público de usuarios', async () => {
      const res = await request(app)
        .post('/api/usuarios/registro')
        .send({ nombre: 'Test Público', email: 'publico@test.com', password: '123' });

      expect(res.status).to.equal(201);
      expect(res.body.email).to.equal('publico@test.com');
    });

    it('Debe loguear el usuario y obtener token', async () => {
      const res = await request(app)
        .post('/api/usuarios/login')
        .send({ email: 'user@test.com', password: 'user123' });

      expect(res.status).to.equal(200);
      tokenUser = res.body.token;
    });

    it('Debe listar usuarios (solo admin)', async () => {
      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(2);
    });

    it('Usuario común no puede listar usuarios', async () => {
      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).to.equal(403);
    });
  });

  describe('Gestión de Libros', () => {
    it('Debe crear un libro con stock múltiple', async () => {
      const libro = {
        titulo: 'El Principito',
        autor: 'Antoine de Saint-Exupéry',
        isbn: '978-0156012195',
        editorial: 'Salamandra',
        año: 1943,
        stock: 4,
        stockTotal: 4, // Debe coincidir con stock inicial
        prestados: 0 // Opcional (por el default)
      };

      const res = await request(app)
        .post('/api/libros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send(libro);

      expect(res.status).to.equal(201);
      expect(res.body.stock).to.equal(4);
      expect(res.body.stockTotal).to.equal(4);
      expect(res.body.prestados).to.equal(0);
      libroId = res.body._id;
    });

    it('Usuario común no puede crear libros', async () => {
      const res = await request(app)
        .post('/api/libros')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ titulo: 'Test', autor: 'Test', stock: 1 });

      expect(res.status).to.equal(403);
    });

    it('Debe listar libros (acceso público)', async () => {
      const res = await request(app)
        .get('/api/libros');

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0].titulo).to.equal('El Principito');
    });

    it('Debe obtener un libro por ID', async () => {
      const res = await request(app)
        .get(`/api/libros/${libroId}`);

      expect(res.status).to.equal(200);
      expect(res.body.titulo).to.equal('El Principito');
    });

    it('Debe actualizar stock de un libro', async () => {
      const res = await request(app)
        .put(`/api/libros/${libroId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ stockTotal: 6 });

      expect(res.status).to.equal(200);
      expect(res.body.stockTotal).to.equal(6);
      expect(res.body.stock).to.equal(6);
    });
  });

  describe('Préstamos y Devoluciones', () => {
    it('Debe reservar un libro como usuario', async () => {
      const res = await request(app)
        .post(`/api/libros/reservar/${libroId}`)
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).to.equal(200);
      expect(res.body.mensaje).to.equal('Libro reservado exitosamente');
      expect(res.body.libro.stock).to.equal(5); // 6 - 1
      expect(res.body.libro.prestados).to.equal(1);
    });

    it('No debe permitir reservar el mismo libro dos veces', async () => {
      const res = await request(app)
        .post(`/api/libros/reservar/${libroId}`)
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Ya tienes una copia de este libro');
    });

    it('Debe verificar préstamos del usuario', async () => {
      const res = await request(app)
        .get('/api/usuarios/mis-prestamos')
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).to.equal(200);
      expect(res.body.totalPrestamosActivos).to.equal(1);
      expect(res.body.prestamosActuales).to.be.an('array');
      expect(res.body.prestamosActuales[0].libro.titulo).to.equal('El Principito');
    });

    it('Debe crear más libros para probar límite de préstamos', async () => {
      const libros = [
        { titulo: '1984', autor: 'George Orwell', stock: 3, stocktotal: 3, editorial: 'debolsillo' },
        { titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', stock: 2, stocktotal: 3, editorial: 'asd' }
      ];

      for (const libro of libros) {
        const res = await request(app)
          .post('/api/libros')
          .set('Authorization', `Bearer ${tokenAdmin}`)
          .send(libro);

        expect(res.status).to.equal(201);

        // Reservar cada libro
        const reserva = await request(app)
          .post(`/api/libros/reservar/${res.body._id}`)
          .set('Authorization', `Bearer ${tokenUser}`);

        expect(reserva.status).to.equal(200);
      }
    });

    it('No debe permitir más de 3 préstamos', async () => {
      // Crear un libro más
      const res = await request(app)
        .post('/api/libros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ titulo: 'El Quijote', autor: 'Cervantes', stock: 5 });

      const libroExtra = res.body._id;

      // Intentar reservar un 4to libro
      const reserva = await request(app)
        .post(`/api/libros/reservar/${libroExtra}`)
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(reserva.status).to.equal(400);
      expect(reserva.body.error).to.include('Ya tienes 3 libros prestados');
    });

    it('Debe devolver un libro', async () => {
      const res = await request(app)
        .post(`/api/libros/devolver/${libroId}`)
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).to.equal(200);
      expect(res.body.mensaje).to.equal('Libro devuelto correctamente');
      expect(res.body.libro.stock).to.equal(6); // 5 + 1
      expect(res.body.diasPrestado).to.be.a('number');
    });

    it('No debe permitir devolver un libro no prestado', async () => {
      const res = await request(app)
        .post(`/api/libros/devolver/${libroId}`)
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('No tienes este libro prestado');
    });

    it('Debe mostrar historial después de devolución', async () => {
      const res = await request(app)
        .get('/api/usuarios/mis-prestamos')
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).to.equal(200);
      expect(res.body.totalPrestamosActivos).to.equal(2); // Quedaron 2 libros
      expect(res.body.historial).to.be.an('array');
      expect(res.body.historial.length).to.be.at.least(1);
    });
  });

  describe('Estadísticas y Administración', () => {
    it('Debe obtener estadísticas de la biblioteca', async () => {
      const res = await request(app)
        .get('/api/libros/estadisticas');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('totalLibros');
      expect(res.body).to.have.property('librosPrestados');
      expect(res.body).to.have.property('librosDisponibles');
      expect(res.body).to.have.property('totalUsuarios');
      expect(res.body).to.have.property('usuariosConPrestamos');
    });

    it('No debe permitir eliminar libro con copias prestadas', async () => {
      // Obtener un libro que esté prestado
      const libros = await request(app).get('/api/libros');
      const libroPrestado = libros.body.find(l => l.prestados > 0);

      const res = await request(app)
        .delete(`/api/libros/${libroPrestado._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('No se puede eliminar');
    });

    it('Debe eliminar libro sin préstamos', async () => {
      // Crear un libro nuevo sin préstamos
      const nuevoLibro = await request(app)
        .post('/api/libros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ titulo: 'Libro temporal', autor: 'Test', stock: 1 });

      const res = await request(app)
        .delete(`/api/libros/${nuevoLibro.body._id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).to.equal(200);
      expect(res.body.mensaje).to.equal('Libro eliminado correctamente');
    });

    it('No debe permitir eliminar usuario con libros prestados', async () => {
      const res = await request(app)
        .delete(`/api/usuarios/${usuarioId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('tiene libros prestados');
    });

    it('No debe permitir eliminar administradores', async () => {
      // Obtener ID del admin
      const usuarios = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      const adminId = usuarios.body.find(u => u.email === 'admin@test.com')._id;

      const res = await request(app)
        .delete(`/api/usuarios/${adminId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).to.equal(400);
      // Cambiar la expectativa del mensaje
      expect(res.body.error).to.include('No se puede borrar un administrador');
    });

    it('Debe cambiar rol de usuario', async () => {
      // Crear otro usuario
      const nuevoUser = await request(app)
        .post('/api/usuarios/registro')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre: 'Nuevo Admin', email: 'newadmin@test.com', password: '123' });

      const res = await request(app)
        .put(`/api/usuarios/${nuevoUser.body._id}/rol`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ rol: 'admin' });

      expect(res.status).to.equal(200);
      expect(res.body.rol).to.equal('admin');
    });
  });

  describe('Casos de error y validaciones', () => {
    it('No debe crear libro sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/libros')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ titulo: 'Solo título' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Faltan campos requeridos');
    });

    it('No debe registrar usuario con email duplicado', async () => {
      const res = await request(app)
        .post('/api/usuarios/registro')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre: 'Duplicado', email: 'user@test.com', password: '123' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Usuario ya registrado');
    });

    it('No debe aceptar rol inválido', async () => {
      const res = await request(app)
        .put(`/api/usuarios/${usuarioId}/rol`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ rol: 'superadmin' });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Rol inválido');
    });

    it('No debe permitir login con credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/usuarios/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' });

      expect(res.status).to.equal(401);
      expect(res.body.error).to.include('Credenciales inválidas');
    });

    it('No debe aceptar token inválido', async () => {
      const res = await request(app)
        .get('/api/usuarios')
        .set('Authorization', 'Bearer tokeninvalido123');

      expect(res.status).to.equal(403);
      expect(res.body.error).to.include('Token inválido');
    });

    it('No debe aceptar requests sin token', async () => {
      const res = await request(app)
        .post(`/api/libros/reservar/${libroId}`);

      expect(res.status).to.equal(403);
      expect(res.body.error).to.include('Token requerido');
    });
  });
});