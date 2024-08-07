const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  profileImage: {
    type: String,
  },
  cart: [{ type: Schema.Types.ObjectId, ref: "Car" }],
  address: {
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    phone: {
      type: String,
    },
    pinCode: {
      type: String,
    },
  },
});

const User = model("User", userSchema);

module.exports = User;
