// src/utils/email.js
const nodemailer = require('nodemailer');

let transporterPromise = null;

/**
 * Obtiene (o crea) el transporter apuntando a Ethereal.
 * @returns {Promise<import('nodemailer').Transporter>}
 */
async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  // 1️⃣ Genera una cuenta de prueba en Ethereal
  transporterPromise = nodemailer.createTestAccount().then(account => {
    // 2️⃣ Configura el transport SMTP con las credenciales generadas
    return nodemailer.createTransport({
      host: account.smtp.host,    // smtp.ethereal.email          :contentReference[oaicite:3]{index=3}
      port: account.smtp.port,    // típicamente 587              :contentReference[oaicite:4]{index=4}
      secure: account.smtp.secure, // true si puerto 465           :contentReference[oaicite:5]{index=5}
      auth: {
        user: account.user,       // usuario generado             :contentReference[oaicite:6]{index=6}
        pass: account.pass        // contraseña generada          :contentReference[oaicite:7]{index=7}
      }
    });
  });

  return transporterPromise;
}

/**
 * Envía un correo de texto plano usando Ethereal.
 * @param {string} to      – dirección destino
 * @param {string} subject – asunto
 * @param {string} text    – cuerpo del mensaje
 * @returns {Promise<string>} – URL de previsualización
 */
async function sendEmail(to, subject, text) {
  const transporter = await getTransporter();

  // 3️⃣ Envía el correo
  const info = await transporter.sendMail({
    from: '"Mi App (test)" <no-reply@example.com>',
    to,
    subject,
    text
  });

  // 4️⃣ Obtén la URL de vista previa en Ethereal
  const previewUrl = nodemailer.getTestMessageUrl(info);  // :contentReference[oaicite:8]{index=8}

  console.log(`✉️  Email enviado: ${info.messageId}`);
  console.log(`🔗 Preview URL: ${previewUrl}`);

  return previewUrl;
}

module.exports = sendEmail;
