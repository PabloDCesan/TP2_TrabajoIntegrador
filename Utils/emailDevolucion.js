import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

const enviarEmailDevolucion = async (usuario, libro) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: usuario.email,
        subject: '✅ Devolución confirmada - Biblioteca',
        html: `
            <h2>Hola ${usuario.nombre}!</h2>
            <p>Has devuelto exitosamente el siguiente libro:</p>
            <ul>
                <li><strong>Título:</strong> ${libro.titulo}</li>
                <li><strong>Autor:</strong> ${libro.autor}</li>
                <li><strong>Fecha de devolución:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>¡Gracias por usar nuestro servicio de biblioteca!</p>
            <p>Esperamos que hayas disfrutado la lectura. 📖</p>
            <hr>
            <small>Este es un correo automático, por favor no respondas.</small>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de devolución enviado correctamente');
    } catch (error) {
        console.error('Error enviando email:', error.message);
    }
};

export default enviarEmailDevolucion;