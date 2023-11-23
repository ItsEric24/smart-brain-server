const express = require("express");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");

const db = knex({
  client: "pg",
  connection: {
    connectionString:
      "postgres://smart_brain_db_ay4l_user:acLJxj1sOc0N6Kv7G9X6GrKg7zg56wZL@dpg-clfk0fnjc5ks73e7pjg0-a.frankfurt-postgres.render.com/smart_brain_db_ay4l",
    host: "dpg-clfk0fnjc5ks73e7pjg0-a",
    port: 5432,
    user: "smart_brain_db_ay4l_user",
    password: "acLJxj1sOc0N6Kv7G9X6GrKg7zg56wZL",
    database: "smart_brain_db_ay4l",
  },
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  const message = {
    message: "Hello, world",
  };

  res.json(message);
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const isUser = await db
      .select("email", "hash")
      .from("login")
      .where("email", "=", email);
    if (isUser) {
      const isValidPass = await bcrypt.compare(password, isUser[0].hash);
      if (isValidPass) {
        const user = await db
          .select("*")
          .from("users")
          .where("email", "=", email);

        res.status(200).json(user);
      } else {
        res.status(400).json("Wrong credentials");
      }
    }
  } catch (error) {
    res.status(400).json("unable to signin, check credentials");
  }
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            email: loginEmail[0].email,
            name: username,
            joined: new Date(),
          })
          .then((user) => {
            res.json(user);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.status(400).json("unable to register"));
});

app.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.select().from("users").where({
      id: id,
    });

    if (user.length > 0) {
      res.json(user[0]);
    } else {
      res.status(400).json("Error getting user");
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

app.put("/image", async (req, res) => {
  const { id } = req.body;
  try {
    const entries = await db("users")
      .where("id", "=", id)
      .increment("entries", 1)
      .returning("entries");

    res.json(entries[0]);
  } catch (error) {
    res.status(400).json("unable to get entries");
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
