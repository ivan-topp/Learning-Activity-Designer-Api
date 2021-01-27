const mongoose = require('mongoose');

const dbConnection = async () => {
    try{
        await mongoose.connect(process.env.DB_CNN, {
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });

        console.log('Successfully connected to the database');
    }catch(error){
        console.log(error);
        throw new Error('Error a la hora de inicializar la base de datos');
    }
};

module.exports = {
    dbConnection
};