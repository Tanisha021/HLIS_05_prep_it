// const { response } = require("express");
const response_code = require("../../../../utilities/response-error-code");
const constant = require("../../../../config/constant");
const common = require("../../../../utilities/common");
const userModel = require("../models/user-model");
const authModel = require("../models/auth-model");
const Validator = require('Validator')
const {default: localizify} = require('localizify');
const validationRules  = require('../../../validation_rules');
const middleware = require("../../../../middleware/validators");
const { t } = require("localizify");


class User {
    signup(req, res) {
        const request_data = JSON.parse(common.decryptPlain(req.body));
        const rules = validationRules.signup;
        let message = {
            required: req.language.required,
            email: t('email'),
            'phone_number.regex': t('mobile_number_numeric'),
            'passwords.min': t('passwords_min')
        };
    
        let keywords = {
            'password_': t('rest_keywords_password'),
            'email_id': t('email'),
            'phone_number.size': t('rest_keywords_phone_number'),
            'phone_number.regex': t('mobile_number_numeric')
        };

        const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
    
        if (valid) {
            authModel.signup(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }
        // userModel.signup(request_data, (_responseData) => {
        //     common.response(res, _responseData)
        // });
    }
    async login(req, res) {
        try{
        // var request_data = req.body;

            // {
    //   "email_id": "sm@example.com",
    //   "password_": "mypassword1"
    // }
    // console.log(req);
    console.log(req.body);
    
        const request_data = JSON.parse(common.decryptPlain(req.body));

        console.log(request_data);
        const rules = validationRules.login;

        let message={
            required: req.language.required,
            email: t('email'),
            'password_.min': t('passwords_min')
        }

        let keywords={
            'email_id': t('rest_keywords_email_id'),
            'password_':t('rest_keywords_password')
        }
            const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
            console.log("Valid",valid);
            if (!valid) return;
            
            const responseData = await authModel.login(request_data);
            
            // Send response
            return common.response(res, responseData);
        // if(middleware.checkValidation(req,res,request,rule,message,keywords)){
        //     userModel.login(request_data, (_responseData) => {
        //         middleware.send_responseresponse(res, _responseData);
        //     });
        // }
        }catch(error){
            console.error("Error in login:", error);
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
        }

    }
    // generate OTP Function
    verifyOTP(req, res) {
        // var request_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(req.body));
        authModel.verifyOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    validateOTP(req, res) {
        // var request_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(req.body));
        authModel.validateOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    resendOTP(req, res) {
        // var request_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(req.body));
        authModel.resendOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    // update user profile
    completeUserProfile(req, res) {
        try{        
            // const request_data = req.body;
            const request_data = JSON.parse(common.decryptPlain(req.body));
            const rules = validationRules.completeUserProfile; 

        let message={
            required: req.language.required
        }

        let keywords={
            
        }
        console.log("Userid",req.user_id)
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        if(valid){
            authModel.completeUserProfile(request_data,req.user_id, (_responseData) => {
                common.response(res, _responseData);
            });
        }

        }catch(error){
            console.error("Error in complete_profile:", error);
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong')
            });
        }

        // if (!request_data.user_id) {
        //     return common.response(res, {
        //         code: common.response_code.OPERATION_FAILED,
        //         message: "User ID is required"
        //     });
        // }

        // userModel.updateUserProfile(request_data, (_responseData) => {
        //     common.response(res, _responseData);
        // });
    }

    forgotPassword(req, res) {
        try{
            // var request_data = req.body;
            const request_data = JSON.parse(common.decryptPlain(req.body));

            const rules = validationRules.forgotPassword;
            // let message = req.language.required;
            let message = {
                required: req.language.required,
                email: t('email'),
            };
        
            let keywords = {
                'email_id': t('rest_keywords_email_id')
            };
    
            const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
        
            if (valid) {
                authModel.forgotPassword(request_data, (_responseData) => {
                    common.response(res, _responseData);
                });
            }
            // userModel.forgotPassword(request_data, (_responseData) => {
            //     common.response(res, _responseData);
            // });
        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong')
            });
        }
       
    }
    async resetPassword(req, res) {
        try{
            // var request_data = req.body;
            const request_data = JSON.parse(common.decryptPlain(req.body));
             const rules = validationRules.resetPassword;
            // let message = req.language.required;
            let message = {
                required: req.language.required,
                email: t('email'),
                'passwords.min': t('passwords_min')
            };
        
            let keywords = {
                'email_id': t('rest_keywords_email_id')
            };
    
            const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
            if (!valid) return;
        
            // if (valid) {
            //     authModel.resetPassword(request_data, (_responseData) => {
            //         common.response(res, _responseData);
            //     });
            // }
             // Call the model function
            const responseData = await authModel.resetPassword(request_data);
            
            // Send response
            return common.response(res, responseData);
        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong')
            });
        }
      

        // userModel.resetPassword(request_data, (_responseData) => {
        //     common.response(res, _responseData);
        // });
    }
    async changePassword(req, res) {
        try{
            // var request_data = req.body;
            const request_data = JSON.parse(common.decryptPlain(req.body));

            const rules = validationRules.changePassword

            let message={
                required:req.language.required,
                required: t('required'),
                'old_password.min': t('passwords_min'),
                'new_password.min': t('passwords_min')
            }

            let keywords={
                'new_password': t('rest_keywords_password'),
                'old_password': t('rest_keywords_password')
            }

            const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
            
        if (!valid) return;
        
            const responseData = await authModel.changePassword(request_data,req.user_id);
            
            // Send response
            return common.response(res, responseData);
        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong')
            });
        }
        // var request_data = req.body;

        // userModel.changePassword(request_data, (_responseData) => {
        //     common.response(res, _responseData);
        // });
    }



    async getItemDetails(req, res) {
        try{
            // console.log("fghjk",req.body);
            
            const request_data = JSON.parse(common.decryptPlain(req.body));

            console.log(request_data);
            const rules = validationRules.getItemDetails;

            let message={
                required: req.language.required,
                item_id: t('item_id'),
                
            }

            let keywords={
                item_id: t('item_id')
            }
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        console.log("Valid",valid);
        if (!valid) return;
        const responseData = await userModel.getItemDetails(request_data);
        
        // Send response
        return common.response(res, responseData);

        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
    }
    }
    async getOrderDetails(req, res) {
        try{
            // console.log("fghjk",req.body);
            
            const request_data = JSON.parse(common.decryptPlain(req.body));

            console.log(request_data);
            const rules = validationRules.getOrderDetails;

            let message={
                 required: req.language.required,
                 order_id: t('order_id')
                
            }

            let keywords={
                order_id: t('order_id')
            }
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        console.log("Valid",valid);
        if (!valid) return;
        const responseData = await userModel.getOrderDetails(request_data);
        
        // Send response
        return common.response(res, responseData);

        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
    }
    }
    async addDeliveryAddress(req, res) {
        try{
            // {
            //     "full_name": "John Doe",
            //     "phone_number": "+1234567890",
            //     "email_id": "johndoe@example.com",
            //     "descp": "I need help with my order."
            // }
            
            
            const request_data = JSON.parse(common.decryptPlain(req.body));

            console.log(request_data);
            const rules = validationRules.addDeliveryAddress;

            let message = {
                required: req.language.required,
                latitude: t('latitude'),
                longitude: t('longitude'),
                area_name: t('area_name'),
                flat_number: t('flat_number'),
                block_number: t('block_number'),
                road_name: t('road_name'),
                type_: t('type_'),
                user_id: t('user_id')
            };
            
            let keywords = {
                latitude: t('latitude'),
                longitude: t('longitude'),
                area_name: t('area_name'),
                flat_number: t('flat_number'),
                block_number: t('block_number'),
                road_name: t('road_name'),
                type_: t('type_'),
                user_id: t('user_id')
            };
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        console.log("Valid",valid);
        if (!valid) return;
        const responseData = await userModel.addDeliveryAddress(request_data,req.user_id);
        
        // Send response
        return common.response(res, responseData);

        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
    }
    }
    async help_support(req, res) {
    try{
        // {
        //     "full_name": "John Doe",
        //     "phone_number": "+1234567890",
        //     "email_id": "johndoe@example.com",
        //     "descp": "I need help with my order."
        // }
        
        
        const request_data = JSON.parse(common.decryptPlain(req.body));

        console.log(request_data);
        const rules = validationRules.help_support;

        let message = {
            required: req.language.required,
            user_id: t('user_id'),
            full_name: t('full_name'),
            phone_number: t('phone_number'),
            email_id: t('email_id'),
            descp: t('descp')
        };
        
        let keywords = {
            user_id: t('user_id'),
            full_name: t('full_name'),
            phone_number: t('phone_number'),
            email_id: t('email_id'),
            descp: t('descp')
        };
    const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
    console.log("Valid",valid);
    if (!valid) return;
    const responseData = await userModel.help_support(request_data,req.user_id);
    
    // Send response
    return common.response(res, responseData);

    }catch(error){
        return common.response(res, {
            code: response_code.OPERATION_FAILED,
            message: t('rest_keywords_something_went_wrong') + error
        });
}
}
    
    logout(req, res) {
        var request_data = req.body;
        userModel.logout(request_data,req.user_id, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    delete(req, res) {
        var request_data = req.body;
        userModel.delete(request_data,req.user_id, (_responseData) => {
            common.response(res, _responseData);
        });
    }
};
module.exports = new User();