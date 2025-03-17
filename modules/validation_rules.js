const checkValidatorRules = {

    login: {
        email_id: 'required|email',
        // login_type: 'required|in:S,G,F,A',
        // Passwords should only be required for standard login
        password_: 'required',
        // Social ID should only be required for social logins
        // social_id: 'required_if:login_type,G,F,A'
    },  
    login_admin: {
        email_id: 'required|email',
        password_: 'required'
    },  
    signup: {
        email_id: 'required|email',
        user_name: 'required',
        password_: 'required_if:signup_type,S|min:8',
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
        password_: "required|min:8"
    },
    changePassword:{
        old_password: "required|min:8",
        new_password: "required|min:8"
    },
    getItemDetails:{
        item_id: "required"
    },
    getOrderDetails:{
        order_id: "required"
    },
    addDeliveryAddress: {
        latitude: "required",
        longitude: "required",
        area_name: "required",
        flat_number: "required",
        block_number: "required",
        road_name: "required",
        delivery_info: "required",
        type_: "required|in:home,office"
    },
    helpAndSupport: {
        user_id: "required|numeric",
        full_name: "required|string",
        phone_number: "required|digits:10",
        email_id: "required|email",
        descp: "required|string|min:10"
    },
    place_order: {
        meals: "required|array|min:1",
        category: "required|string",
        item_id: "required|numeric",
        qty: "required|numeric|min:1"
    },
    add_item_by_admin:{
            item_name: "required|string",
            kcal: "required|numeric",
            carbs: "required|numeric",
            protein: "required|numeric",
            fat: "required|numeric",
            desc_: "required|string",
            image_id: "required|numeric",
            ingredient_ids: "required|min:1"
    }
    
    


};

module.exports = checkValidatorRules;

