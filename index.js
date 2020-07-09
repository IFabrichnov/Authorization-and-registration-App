const express = require('express');
const app = express();
const config = require('./config/db');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');

const PORT = config.port || 5000;

//подключение к ДБ
mongoose.connect(config.mongoURi, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})
  .then(() => {
    console.log('mongoDB connected')
  })
  .catch(error => console.log(error));

//подключение пасспорта
require('./config/passport')(passport);

// настройка express
app.use(morgan('dev')); // регистрация каждого запроса в консоли
app.use(cookieParser()); // чтение куков (при аутентификации)
app.use(bodyParser()); // чтение инфы из форм

app.set('view engine', 'ejs'); // чтение ejs

// требуется для пасспорта
app.use(session({secret: 'ivan'})); // ключ для сессии
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); //использование флэш для вывода ошибок

// роуты
require('./routes/auth.js')(app, passport);

// запуск
app.listen(PORT, () => console.log(`server started on ${PORT}`));