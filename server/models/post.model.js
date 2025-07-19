/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const dataTypes = require("sequelize").DataTypes;
// This file defines the Post model for the DOST Information System using Sequelize ORM.
module.exports = (sequelize, Sequelize) => {
  const Post = sequelize.define("post", {
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255], // Title must be between 1 and 255 characters
      },
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    published: {
      type: Sequelize.BOOLEAN,
      defaultValue: false, // Default value for published is false
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false, // Start date can be null
    },
    image: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    tags: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true, // Tags can be null
      validate: {
        len: [0, 10],
      },
    },
  });

  return Post;
};
