/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const dataTypes = require("sequelize").DataTypes;

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50], // Username must be between 3 and 50 characters
      },
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true, // Validates email format
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "user", // Default role is 'user'
    },
  });

  return User;
};