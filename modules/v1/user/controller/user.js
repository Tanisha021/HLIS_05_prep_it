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
const { email_id } = require("../../../../language/en");


class User {
    signup(req, res) {
        // { "user_name": "rakhi", "email_id": "ra@example.com", "phone_number": "6214872340", "code_id": 1, "password_": "mypassword1", "device_type": "Android", "os_version": "13.0", "app_version": "1.2.0", "time_zone": "2025-03-10T10:30:00Z" }
        const request_data = JSON.parse(common.decryptPlain(req.body));
        const rules = validationRules.signup;
        let message = {
            required: req.language.required,
            email_id: t('email'),
            'phone_number.regex': t('mobile_number_numeric'),
            'passwords.min': t('passwords_min'),
            'code_id': t('code_id'),
            'user_name': t('user_name')
        };
    
        let keywords = {
            'password_': t('rest_keywords_password'),
            'email_id': t('email'),
            'phone_number.size': t('rest_keywords_phone_number'),
            'phone_number.regex': t('mobile_number_numeric'),
            'code_id': t('code_id'),
            'user_name': t('user_name')
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

    //         {
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

    validateOTP(req, res) {
        // {
        //     "user_id": 1,
        //     "otp": 7652
        //   }
          
        // var request_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(req.body));
        const rules = validationRules.validateOTP;
        let message = {
            required: req.language.required,
            'phone_number.regex': t('mobile_number_numeric'),
            'otp': t('otp')
        };
    
        let keywords = {
            'phone_number.regex': t('mobile_number_numeric'),
            'otp': t('otp')
        };

        const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
    
        if (valid) {
            authModel.validateOTP(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }
        // const request_data = JSON.parse(common.decryptPlain(req.body));
        // authModel.validateOTP(request_data, (_responseData) => {
        //     common.response(res, _responseData);
        // });
    }
    resendOTP(req, res) {
        // var request_data = req.body;
        const request_data = JSON.parse(common.decryptPlain(req.body));
        const rules = validationRules.validateOTP;
        let message = {
            required: req.language.required,
            email_id: t('email')
        };
    
        let keywords = {
            email_id: t('email'),
        };

        const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
    
        if (valid) {
            authModel.validateOTP(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }
        // const request_data = JSON.parse(common.decryptPlain(req.body));
        // authModel.resendOTP(request_data, (_responseData) => {
        //     common.response(res, _responseData);
        // });
    }

    // update user profile
    completeUserProfile(req, res) {
        // {"latitude": 23.0225, "longitude": 72.5714}
          //{ "goal_id": 4}
        //{ "gender": "F","current_weight_kg": 60, "target_weight_kg": 65, "current_height_cm": 165, "activity_level": "intermediate"}

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
        // {
        //     "email_id":"ra@example.com"
        // }
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
        // {
        //     "user_id": 1,
        //     "email_id":"ra@example.com",
        //     "password_": "mypassword2"
        
        // }
        
        try{
            // var request_data = req.body;
            const request_data = JSON.parse(common.decryptPlain(req.body));
             const rules = validationRules.resetPassword;
            // let message = req.language.required;
            let message = {
                required: req.language.required,
                email_id: t('email'),
                'password_.min': t('passwords_min')
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
        // {
        //     "old_password": "mypassword2",
        //     "new_password":"mypassword3"
        // }
        
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

    async listNotifications(req, res) {
        try{
            // console.log("fghjk",req.body);
            console.log('aaa');
            
            let request_data = {};
    
            // Decrypt only if req.body is not empty
            if (req.body && Object.keys(req.body).length > 0) {
                const decryptedData = common.decryptString(req.body);
                
                // Ensure decrypted data is a valid JSON string before parsing
                if (typeof decryptedData === "string" && decryptedData.trim() !== "") {
                    request_data = JSON.parse(decryptedData);
                } else {
                    return common.response(res, {
                        code: response_code.OPERATION_FAILED,
                        message: "Invalid decrypted data format"
                    });
                }
            }
    
            console.log("Request Data after decryption:", request_data);
            const rules = validationRules.listNotifications;

        const valid = middleware.checkValidationRules(req,res,request_data,rules)
        console.log("Valid",valid);
        if (!valid) return;
        const responseData = await userModel.listNotifications(request_data,req.user_id);
        
        // Send response
        return common.response(res, responseData);

        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
    }
    }

    async getItemDetails(req, res) {
        try{
            // console.log("fghjk",req.body);
            
            const request_data = JSON.parse(common.decryptPlain(req.body));

            // console.log(req.body);
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

            // console.log(request_data);
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

    async place_order(req, res) {
        try {
            let request_data = common.decryptPlain(req.body);
            
            // Ensure request_data is an object
            if (typeof request_data === 'string') {
                try {
                    request_data = JSON.parse(request_data);
                } catch (e) {
                    return common.response(res, {
                        code: response_code.INVALID_REQUEST,
                        message: "Invalid JSON format"
                    });
                }
            }
            
            // Validate meals
            if (!request_data.meals || !Array.isArray(request_data.meals)) {
                return common.response(res, {
                    code: response_code.INVALID_REQUEST,
                    message: "Meals must be provided as an array"
                });
            }
            
            // Store original meals as JSON string before validation might modify it
            const original_meals = JSON.stringify(request_data.meals);
            
            // Continue with validation
            const rules = validationRules.place_order;
            let message = {
                required: req.language.required,
                category: t('category'),
                item_id: t('item_id'),
            };
            
            let keywords = {
                category: t('category'),
                item_id: t('item_id'),
            };
            
            // Create a copy of request_data for validation to avoid modifying the original
            const validation_data = {...request_data};
            
            const valid = middleware.checkValidationRules(req, res, validation_data, rules, message, keywords);
            console.log("Valid", valid);
            if (!valid) return;
            
            // Ensure meals is still an array after validation
            if (typeof request_data.meals === 'string') {
                try {
                    request_data.meals = JSON.parse(original_meals);
                } catch (e) {
                    console.error("Error restoring original meals:", e);
                }
            }
            
            // Add original meals as a backup
            request_data.original_meals = original_meals;
            
            // Call model function with fixed data
            const responseData = await userModel.place_order(request_data, req.user_id);
            
            return common.response(res, responseData);
        } catch (error) {
            console.error("Error in place_order controller:", error);
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
        }
    }
    
    async displayHomePage(req, res) {
        try{
            const request_data = JSON.parse(common.decryptPlain(req.body));

            console.log(request_data);
            const rules = validationRules.displayHomePage;

        const valid = middleware.checkValidationRules(req,res,request_data,rules)
        console.log("Valid",valid);
        if (!valid) return;
        const responseData = await userModel.displayHomePage(request_data,req.user_id);
        
        // Send response
        return common.response(res, responseData);

        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
    }
    }

    async categoryWiseItems(req, res) {
        try{
            let decryptedData = common.decryptString(req.body);
        
            // If decryption fails or returns an error, default to an empty object
            if (typeof decryptedData !== "string" || decryptedData.trim() === "") {
                decryptedData = "{}"; // Ensures JSON.parse doesn't throw an error
            }
    
            const request_data = JSON.parse(decryptedData);

        console.log(request_data);
        const rules = validationRules.categoryWiseItems;

    const valid = middleware.checkValidationRules(req,res,request_data,rules)
    console.log("Valid",valid);
    if (!valid) return;
    const responseData = await userModel.categoryWiseItems(request_data,req.user_id);
    
    // Send response
    return common.response(res, responseData);

    }catch(error){
        return common.response(res, {
            code: response_code.OPERATION_FAILED,
            message: t('rest_keywords_something_went_wrong') + error
        });
}
    }

    async subscribe(req, res) {
        try{
            try{
             
                const request_data = JSON.parse(common.decryptPlain(req.body));
        
                console.log(request_data);
                const rules = validationRules.subscribe;
        
                let message = {
                    required: req.language.required,
                    user_id: t('user_id'),
                    duration_in_months: t('duration_in_months'),

                };
                
                let keywords = {
                   user_id: t('user_id'),
                    duration_in_months: t('duration_in_months'),
                };
            const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
            console.log("Valid",valid);
            if (!valid) return;
            const responseData = await userModel.subscribe(request_data,req.user_id);
            
            // Send response
            return common.response(res, responseData);
        
            }catch(error){
                return common.response(res, {
                    code: response_code.OPERATION_FAILED,
                    message: t('rest_keywords_something_went_wrong') + error
                });
        }
        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
        }
    }

    async logout(req, res) {
        try{
            const request_data = JSON.parse(common.decryptPlain(req.body));

            console.log(request_data);
            const rules = validationRules.logout;

        const valid = middleware.checkValidationRules(req,res,request_data,rules)
        console.log("Valid",valid);
        if (!valid) return;
        const responseData = await userModel.logout(request_data,req.user_id);
        
        // Send response
        return common.response(res, responseData);

        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + error
            });
    }
    }

    async delete(req, res) {
        try {
            console.log("Request Body:", req.body, "Type:", typeof req.body);
    
            let request_data = {};
    
            // Decrypt only if req.body is not empty
            if (req.body && Object.keys(req.body).length > 0) {
                const decryptedData = common.decryptString(req.body);
                
                // Ensure decrypted data is a valid JSON string before parsing
                if (typeof decryptedData === "string" && decryptedData.trim() !== "") {
                    request_data = JSON.parse(decryptedData);
                } else {
                    return common.response(res, {
                        code: response_code.OPERATION_FAILED,
                        message: "Invalid decrypted data format"
                    });
                }
            }
    
            console.log("Request Data after decryption:", request_data);
    
            // Validate request data
            const rules = validationRules.delete;
            const valid = middleware.checkValidationRules(req, res, request_data, rules);
            console.log("Valid", valid);
            if (!valid) return;
    
            // Call the delete function
            const responseData = await userModel.delete(request_data, req.user_id);
    
            // Send response
            return common.response(res, responseData);
    
        } catch (error) {
            console.error("Error in delete:", error);
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: `Oopss... Something Went Wrong! ${error.message}`
            });
        }
    }


};
module.exports = new User();