const {model, Schema} = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const userSchema = new Schema({
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true}
});

//хэширую пароль
userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// проверка на валидность пароля
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// создание модели пользователя
module.exports = model('User', userSchema);