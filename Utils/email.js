import nodemailer from "nodemailer";
import config from "../config.js";

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

const enviarEmailReserva = async (usuario, libro) => {
  const mailOptions = {
    from: config.EMAIL_USER,
    to: usuario.email,
    subject: 'Reserva confirmada',
    text: `Hola ${usuario.nombre},\n\nReservaste el libro "${libro.titulo}" de ${libro.autor}.\n\n¡Gracias por usar la biblioteca!`
  };

  await transporter.sendMail(mailOptions);
};

export default enviarEmailReserva;
