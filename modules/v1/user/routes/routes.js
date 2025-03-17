const User = require('../controller/user');  

const customerRoute = (app) => {
    //authentication
     app.post("/v1/user/signup", User.signup); 
     app.post("/v1/user/login", User.login);
    //  app.post("/v1/user/generate-otp", User.verifyOTP);
     app.post("/v1/user/verify-otp", User.validateOTP);
     app.post("/v1/user/resend-otp", User.resendOTP);
    //  app.get("/v1/user/check-verification", User.checkUserVerification);
     app.post("/v1/user/complete-profile", User.completeUserProfile);
     app.post("/v1/user/forgot-password", User.forgotPassword);
     app.post("/v1/user/reset-password", User.resetPassword);
     app.post("/v1/user/change-password", User.changePassword);

     app.post("/v1/user/item-details", User.getItemDetails);
     app.post("/v1/user/order-details", User.getOrderDetails);
     app.post("/v1/user/list_notifications", User.listNotifications);
     app.post("/v1/user/add-delivery-details", User.addDeliveryAddress);
     app.post("/v1/user/help-support", User.help_support);
     app.post("/v1/user/place-order", User.place_order);
     app.post("/v1/user/logout", User.logout);
     app.post("/v1/user/delete", User.delete);

};

module.exports = customerRoute;



