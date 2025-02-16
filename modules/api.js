const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const auth_controller = require('./controller/user');
const service_controller = require('./controller/service');
const appointment_controller = require('./controller/appointment');
const vehicle_controller = require('./controller/vehicle');

app.use(auth_controller);
app.use(service_controller);
app.use(appointment_controller);
app.use(vehicle_controller);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

