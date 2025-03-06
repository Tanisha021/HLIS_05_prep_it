const checkValidatorRules = {

    login: {
        email_id: 'required|email',
        login_type: 'required|in:S,G,F,A',
        // Passwords should only be required for standard login
        passwords: 'required_if:login_type,S',
        // Social ID should only be required for social logins
        social_id: 'required_if:login_type,G,F,A'
    },  
    signup: {
        email_id: 'required|email',
        signup_type: 'required|in:S,G,F,A',
        passwords: 'required_if:signup_type,S|min:8',
        social_id: 'required_if:signup_type,G,F,A',
        phone_number: 'string|size:10|regex:/^[0-9]{10}$/'
    },
    forgotPassword:{
        email_id: "required|email"

    },
    addProfilePic:{
        user_id: "required",
        profile_pic: "required"
    },
    verifyOTP: {
        email_id: 'required',
        otp: 'required'
    },
    resetPassword:{
        email_id: "required|email",
        passwords: "required|min:8"
    },
    changePassword:{
        user_id: "required",
        old_password: "required|min:8",
        new_password: "required|min:8"
    },
    compeleteUserProfile:{
        fname:"required",
        lname:"required",
        address:"required",
        dob:"required",
        gender:"required"
    },
    


};

module.exports = checkValidatorRules;

