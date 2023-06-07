const config = require("../configuration/config.json");
const User = require("../models/User");
const { v4 } = require("uuid");
const { mailOptions } = require("../configuration/emailHandler");
const fs = require("fs");
const { validate } = require("email-validator");

const handleErrors = (err) => {
  //When creating a new function and used handleErrors(), always use these 2 functions to see the occuring error.
  // console.log(err.message);
  // console.log(err.code);

  let errors = "";

  if (err.message === "Fill out the fields!") {
    errors = "Fill out the fields!";
  }

  if (err.message === "The user info does not match!") {
    errors = "The user info does not match!";
  }

  if (err.message === "Please enter a correct email.") {
    errors = "Please enter a correct email.";
  }

  if (err.code === "ENOENT") {
    errors = "User does not exists!";
  }

  if (err.message.includes("Error:")) {
    Object.values(err.errors).forEach((properties) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new Error("Fill out the fields!");
    }

    const userData = fs.readFileSync(
      `${config.USERS_FOLDER}/_${username}.json`
    );

    const uuid = v4();
    const parsedUserData = JSON.parse(userData);
    const userExists = await User.findOne({ username: username });

    if (password !== parsedUserData.password) {
      throw new Error("The user info does not match!");
    }

    //If this user does not exists to database, it will record its information and store it only once.
    if (!userExists) {
      mailOptions({
        from: config.MAIL_CREDENTIALS.MAIL_USER,
        to: parsedUserData.email,
        subject: "Account registered",
        html: `Your account has been registered to ${config.SITE_NAME}.`,
      });

      User.create({
        uniqueId: uuid,
        username: username,
        email: parsedUserData.email,
        password: password,
      });

      return res.status(201).json({
        uniqueId: uuid,
        username: username,
      });
    }

    res.status(200).json({
      uniqueId: userExists.uniqueId,
      username: userExists.username,
    });
    next();
  } catch (e) {
    res.status(400).json({ errors: handleErrors(e) });
    next();
  }
};

exports.contact = async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      throw new Error("Fill out the fields!");
    }

    if (!validate(email)) {
      throw new Error("Please enter a correct email.");
    }

    mailOptions({
      from: config.MAIL_CREDENTIALS.MAIL_USER,
      to: email,
      subject: `${subject} - Contact support`,
      html: `<span>Email: <b>${email}</b><br>Subject: <b>${subject}</b><br>Message: <b>${message}</b></span><br><span><p>Please reply back at this email.</p></span>`,
    });

    res.status(200).json({ data: "Email sent successfully." });
    next();
  } catch (e) {
    res.status(400).json({ errors: handleErrors(e) });
    next();
  }
};
