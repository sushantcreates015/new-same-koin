require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI)
.then(async () => {

    const exists = await Admin.findOne({
        username: "admin"
    });

    if (exists) {
        console.log("Admin already exists.");
        process.exit();
    }

    const hashedPassword = await bcrypt.hash("crazzyadmin123", 10);

    await Admin.create({
        username: "admin",
        password: hashedPassword
    });

    console.log("Admin created successfully!");
    process.exit();

})
.catch(err => {
    console.log(err);
});
