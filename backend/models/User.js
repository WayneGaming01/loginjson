const mongoose = require("mongoose");
const moment = require("moment");
const bcrypt = require("bcryptjs");

const UserSchema = mongoose.Schema(
  {
    uniqueId: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    createdAt: {
      type: String,
      default: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
  },
  { versionKey: false }
);

UserSchema.pre("save", async function (doc) {
  const salt = await bcrypt.genSalt(10);
  this.password = bcrypt.hash(this.password, salt);
});

UserSchema.statics.login = async function (username, password) {
  const user = await this.findOne({ username });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
  }
};

const User = mongoose.model("user", UserSchema);

module.exports = User;
