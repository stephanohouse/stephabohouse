const { v4: uuidv4 } = require("uuid");

module.exports = () => {
  return "TCK-" + uuidv4().split("-")[0].toUpperCase();
};
