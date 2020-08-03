# Приложение регистрации, авторизации и отправки сообщений 

## Пакет package.json

Приложение использует пакеты: **expressjs, ejs, mongoose, passportjs, passport-local, connect-flash, bcrypt-nodejs.** 


## Настройка приложения

**index.js** - файл, в котором подключены все пакеты, включая сервер и базу данных MongoDB.

```javascript
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
```

Теперь приложение прослушивает порт 5000. 


## База данных 

Регистрируюсь на **MongoDB**, создаю базу данных для приложения, помещаю uri в файл db.jd (своего рода конфиг), куда помещаю еще и port.
```javascript
module.exports = {
"port": 5000,
"mongoURi": "mongodb+srv://ivan:@cluster0.fixsz.azure.mongodb.net/fullstack?retryWrites=true&w=majority"
};
```

## Роуты (routes/auth.js)

Приложение имеет следующие маршруты:
1) Домашняя страница (/)
2) Страница логина (/login)
3) Страница регистрации (/register)
4) Страница отправки сообщений (/quotes)

Создаю файл **auth.js** в котором находятся все роуты и рендеринг страниц.


```javascript
const Article = require('../models/Article');

module.exports = function (app, passport) {
  //домашняя страница
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  //login форма
  app.get('/login', function (req, res) {
    res.render('login.ejs', {message: req.flash('loginMessage')});
  });
  //процесс в логин форме
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/quotes',
    failureRedirect: '/login',
    failureFlash: true
  }));


  //register форма
  app.get('/register', function (req, res) {
    res.render('register.ejs', {message: req.flash('registerMessage')});
  });
  //процесс в регистр форме
  app.post('/register', passport.authenticate('local-register', {
    successRedirect: '/quotes',
    failureRedirect: '/register',
    failureFlash: true
  }));


  //помещаем посты в базу данных
  app.post('/quotes', async (req, res) => {
      const article = new Article({
        title: req.body.title,
        description: req.body.description
      });

      await article.save();
      //после сохранения в базу данных сообщения, редиректим на эту же страницу
      res.redirect('/quotes');
    }
  );


//подключаю форму с написанием постов
//через модель Article находим массив всех элементов из базы данных
//рендерим ejs вместо html, в файл данные массива из бд
  app.get("/quotes", isLoggedIn, (req, res) => {
    Article.find()
      .then(result => res.render("quotes.ejs", {quotes: result}))
  });


  //logout
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

};

function isLoggedIn(req, res, next) {
  // если пользователь аутентифицирован в сеансе, то пропускает дальше
  if (req.isAuthenticated())
    return next();
  // если нет, то редирект
  res.redirect('/');
}
```


## Страницы фронтенда (home, login, register, quotes)


### login (/login)

Так как все страницы, кроме /quotes, похожи, покажи только login. 
Страницы созданы с помощью ejs.

```javascript
<!doctype html>
<html>
<head>
    <title>Вход или регистрация</title>
    <style>
        body        { padding-top:20px; }
    </style>
</head>
<body>
<div class="container">
        <h1></span> Login</h1>

        <!-- возврат ошибок -->
        <% if (message.length > 0) { %>
            <div><%= message %></div>
        <% } %>

        <!-- Логин фаорма -->
        <form action="/login" method="post">
                <label>Email</label>
                <input type="text"  name="email">
                <label>Password</label>
                <input type="password"  name="password">

            <button type="submit">Вход</button>
        </form>

        <hr>

        <p>Нужен новый аккаунт? <a href="/register">Регистрация</a></p>
        <p>Или <a href="/">Домой</a></p>

    </div>

</div>
</body>
</html>
```

### Цитаты (/quotes)

**/quotes** отправляет цитату из формы, сохраняет ее в базе данных, сразу же подгружает ее и постит сообщение снизу под формой.

Чтобы создавать посты, изначально нужно создать модель поста (Article).

```javascripta
const {model, Schema} = require('mongoose');

const Article = new Schema({
  title: {type: String, required: true},
  description: {type: String, required: true}
});

module.exports = model('article', Article);
```

С помощью ejs рендерим цитаты на странице quotes, под формой отправки.

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Вход или регистрация</title>
</head>
<body>
<form action="/quotes" method="POST">
    <input type="text" placeholder="title" name="title">
    <input type="text" placeholder="description" name="description">
    <button type="submit">Submit</button>

    <br>
    <br>

    <h2> Цитаты </h2>

    <ul class="quotes">
        <% for(var i = 0; i < quotes.length; i++) {%>
            <li class="quote">
                <span><%= quotes[i].title %></span>
                <span><%= quotes[i].description %></span>
            </li>
        <% } %>
    </ul>
</form>

<br>

<button><a href="/logout" >Выход</a></button>
</body>
</html>
```

## Модели

Выше я описал модель *Article* для отправки сообщений, так же понадобится модель User.js, для создания нового юзера. 

```javascripta
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
```

## Обработка регистрации и авторизации

### register и login

Обработка регистрации и логина происходит в /confin/passport.js
Все манипуляции происходят благодаря библиотеки passportJS. Так же и в /auth.js

```javascript
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  //стратегия регистрации
  passport.use('local-register', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      process.nextTick(() => {
        User.findOne({'email': email}, (err, user) => {
          if (err)
            return done(err);
          if (user) {
            return done(null, false, req.flash('registerMessage', 'Почта уже использована'));
          } else {
            var newUser = new User();
            newUser.email = email;
            newUser.password = newUser.generateHash(password);

            //cохраняем нового пользователя
            newUser.save(function (err) {
              if (err)
                throw err;
              return done(null, newUser);
            });
          }

        });

      });

    }));


  //стратегия логина
  passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      // ищем пользователя с данной почтой
      // проверка, существует ли пользователь
      User.findOne({'email': email}, function (err, user) {
        if (err)
          return done(err);
        if (!user)
          return done(null, false, req.flash('loginMessage', 'Нет такого пользователя.'));
        // если пользователь найден , но пароль неверный
        if (!user.validPassword(password))
          return done(null, false, req.flash('loginMessage', 'Неверный пароль!'));

        // все ок
        return done(null, user);
      });

    }));
};
```
