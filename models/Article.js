const {model, Schema} = require('mongoose');

const Article = new Schema({
  title: {type: String, required: true},
  description: {type: String, required: true}
});

module.exports = model('article', Article);