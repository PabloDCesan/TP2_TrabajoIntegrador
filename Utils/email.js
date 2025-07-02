// Utils/email.js - CORREGIDO
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Permite certificados auto-firmados
    }
});

const enviarEmailReserva = async (usuario, libro) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: usuario.email,
        subject: '📚 Reserva confirmada - Biblioteca',
        html: `
            <h2>Hola ${usuario.nombre}!</h2>
            <p>Has reservado exitosamente el siguiente libro:</p>
            <ul>
                <li><strong>Título:</strong> ${libro.titulo}</li>
                <li><strong>Autor:</strong> ${libro.autor}</li>
                <li><strong>Fecha de préstamo:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
            <p><strong>Recuerda:</strong> Tienes un máximo de 30 días para devolver el libro.</p>
            <p>¡Disfruta tu lectura!</p>
            <hr>
            <small>Este es un correo automático, por favor no respondas.</small>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email enviado correctamente');
    } catch (error) {
        console.error('Error enviando email:', error.message);
        // No lanzamos el error para que no falle la reserva si el email falla
    }
};

export default enviarEmailReserva;