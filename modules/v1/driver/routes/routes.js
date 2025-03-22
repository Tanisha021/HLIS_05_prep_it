const User = require('../controller/driver');  

const customerRoute = (app) => {
    //authentication
     app.post("/v1/driver/signup", User.signup); 
     app.post("/v1/driver/login", User.login);
     app.post("/v1/driver/verify-otp", User.validateOTP);
     app.post("/v1/driver/resend-otp", User.resendOTP);
     app.post("/v1/driver/forgot-password", User.forgotPassword);
     app.post("/v1/driver/validate-forgot-password", User.validateForgotPasswordOTP);
     app.post("/v1/driver/reset-password", User.resetPassword);
     app.post("/v1/driver/change-password", User.changePassword);

    
    // app.post("/v1/user/logout", User.logout);
    app.post("/v1/driver/delete", User.delete);

};

module.exports = customerRoute;



