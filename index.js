require('./src/config/config');
const app = require('./src/app');
require('dotenv').config();

app.listen(process.env.PORT, () => {
    console.log('Server listen on port: ', process.env.PORT);
});