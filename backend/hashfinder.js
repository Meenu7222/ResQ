const bcrypt = require('bcryptjs');
bcrypt.hash('Admin', 10, (err, hash) => {
    console.log(hash);
});