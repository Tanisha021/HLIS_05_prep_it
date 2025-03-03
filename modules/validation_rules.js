const checkValidatorRules = {

    login: {
        email: "required|email",
        passwords: "required|min:8"
    },
    signup: {
        email_id: 'required|email',
        passwords: 'required|min:8',
        // first_name: 'required|string',
        // last_name: 'required|string',
        mobile_number: 'required|string|min:10|regex:/^[0-9]+$/',
        // country_code: 'required'
    },
    forgotPassword:{
        email_id: "required|email"
    },
    verifyOTP: {
        email_id: 'required',
        otp: 'required'
    },
    resetPassword:{
        email_id: "required|email",
        passwords: "required|min:8"
    },
    compeleteUserProfile:{
        user_full_name: "required",
        date_of_birth: "required"
    },
    create_post:{
        descriptions: "required",
        title: "required",
        category_name: "required",
        user_id: "required"
    },
    

};

module.exports = checkValidatorRules;

