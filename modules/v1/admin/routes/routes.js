const Admin = require('../controller/admin');  

const adminRoute = (app) => {
    app.post("/v1/admin/login", Admin.login_admin);
    app.post("/v1/admin/add-item", Admin.add_item_by_admin);

};

module.exports = adminRoute;    



