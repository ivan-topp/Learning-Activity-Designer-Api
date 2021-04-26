module.exports = {

    verificationCode: code => ({
        subject: 'Codigo de verificación para reestablecer contraseña',
        html: `<div>
            <h3>Código de verificación</h3>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta, el código de verificación y autenticación que debes ingresar en el formulario es el siguiente: ${code}.</p>
            <p>IMPORTANTE: Si no ha solicitado reestablecer su contraseña, es importante que no comparta este código con alguien, ya que comprometería la seguridad de su cuenta.</p>
        </div>`,      
        text: ``
    }),
    
}