const nodemailer = require("nodemailer");

exports.SendMail = async () => {
  //   let testAccount = await nodemailer.createTestAccount();

  const host = process.env.Email_Host;
  const user = process.env.Email_Address;
  const password = process.env.Email_Password;

  let transporter = nodemailer.createTransport({
    method: "POST",
    host: host,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: user, // generated ethereal user
      pass: password, // generated ethereal password
    },

    tls: {
      rejectUnauthorized: false,
    },
  });

  let info = await transporter.sendMail({
    from: user, // sender address
    to: "mafemi9839@turuma.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  return info;
};
