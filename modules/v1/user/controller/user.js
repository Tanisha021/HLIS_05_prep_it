// const { response } = require("express");
const response_code = require("../../../../utilities/response-error-code");
const constant = require("../../../../config/constant");
const common = require("../../../../utilities/common");
const userModel = require("../models/user-model");
const Validator = require('Validator')
const {default: localizify} = require('localizify');
const validationRules  = require('../../../validation_rules');
const middleware = require("../../../../middleware/validators");
const { t } = require("localizify");


class User {
    signup(req, res) {
        var request_data = req.body;
        const rules = validationRules.signup;
        let message = {
            required: req.language.required,
            email: t('email'),
            'phone_number.regex': t('mobile_number_numeric'),
            'passwords.min': t('passwords_min')
        };
    
        let keywords = {
            'password': t('rest_keywords_password'),
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
    login(req, res) {
        var request_data = req.body;

        const rules = validationRules.login; 

        let message={
            required: req.language.required,
            email: t('email'),
            'passwords.min': t('passwords_min')
        }

        let keywords={
            'email_id': t('rest_keywords_email_id'),
            'passwords':t('rest_keywords_password')
        }
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        if(valid){
            authModel.login(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }
        // if(middleware.checkValidation(req,res,request,rule,message,keywords)){
        //     userModel.login(request_data, (_responseData) => {
        //         middleware.send_responseresponse(res, _responseData);
        //     });
        // }
    }
    // generate OTP Function
    verifyOTP(req, res) {
        var request_data = req.body;
        authModel.verifyOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    validateOTP(req, res) {
        var request_data = req.body;
        authModel.validateOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    resendOTP(req, res) {
        var request_data = req.body;
        authModel.resendOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    // checkVerification status
    checkUserVerification(req, res) {
        var request_data = req.body;
        authModel.checkUserVerification(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    // update user profile
    compeleteUserProfile(req, res) {
        try{        
            const request_data = req.body;
            const rules = validationRules.compeleteUserProfile; 

        let message={
            required: req.language.required
        }

        let keywords={
            'user_id': t('rest_keywords_user_id'),
            'fname': t('rest_keywords_user_fname'),
            'lname': t('rest_keywords_user_lname'),
            'address': t('rest_keywords_user_address'),
            'gender': t('rest_keywords_gender'),
            'dob': t('rest_keywords_user_date_of_birth'),
        }
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        if(valid){
            authModel.compeleteUserProfile(request_data, (_responseData) => {
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
            var request_data = req.body;

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
    resetPassword(req, res) {
        try{
            var request_data = req.body;
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
        
            if (valid) {
                authModel.resetPassword(request_data, (_responseData) => {
                    common.response(res, _responseData);
                });
            }
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
    changePassword(req, res) {
        try{
            var request_data = req.body;

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
    
        if (valid) {
            authModel.changePassword(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }
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

};
module.exports = new User();