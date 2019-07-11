const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRIP_API_TOKEN)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jsalazar@soin.co.cr',
        subject: 'Sendgrid Test',
        text:'Hello from Sendgrip',
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jsalazar@soin.co.cr',
        subject: 'Cancellation',
        text:'You have cancel.',
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}