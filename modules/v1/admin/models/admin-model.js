const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");
const {default: localizify} = require('localizify');
const { t } = require("localizify");
// const response_code=  require('../../../../utilities/response-error-code');

class AdminModel {
    async login_admin(request_data) {
        try {
            
            if (!request_data.email_id || !request_data.password_) {
                return {
                    code: response_code.BAD_REQUEST,
                    message: "Email and password are required"
                };
            }   
            
            const passwordHash = request_data.password_;
    
                // Query the user from the database
            const selectUserWithCred = "SELECT * FROM admin_ WHERE email_id = ? AND password_ = ?";
            const [status] = await database.query(selectUserWithCred, [request_data.email_id, passwordHash]);

            // If no user found
            if (status.length === 0) {
                console.log("No user found");
                return {
                    code: response_code.NOT_FOUND,
                    message: t('no_data_found')
                };
            }

            const admin_id = status[0].admin_id;
    
            const token = common.generateToken(40);
            const updateTokenQuery = "UPDATE admin_ SET token = ?, is_login = 1 WHERE admin_id = ?";
            await database.query(updateTokenQuery, [token, admin_id]);
    
            const device_token = common.generateToken(40);
            const updateDeviceToken = "UPDATE tbl_device_info_admin SET device_token = ? WHERE admin_id = ?";
            await database.query(updateDeviceToken, [device_token, admin_id]);
    
            // Using await with a Promise wrapper instead of callback pattern for getUserDetailLogin
            // const userInfo = await new Promise((resolve, reject) => {
            //     common.getAdminDetailLogin(admin_id, (err, userResult) => {
            //         if (err) {
            //             reject(err);
            //         } else {
            //             resolve(userResult);
            //         }
            //     });
            // });
            
            const userInfo = await common.getAdminDetailLogin(admin_id);
                if (!userInfo) {
                    return {
                        code: response_code.NOT_FOUND,
                        message: t('no_data_found')
                    };
                }

            userInfo.token = token;
            userInfo.device_token = device_token;
            
            return {
                code: response_code.SUCCESS,
                message: t('login_success'),
                data: userInfo
            };
        } catch (error) {
            console.error("Login error:", error);
            return {
                code: response_code.OPERATION_FAILED,
                message: error.sqlMessage || error.message
            };
        }
    }
    async add_item_by_admin(request_data){
        try{
            const item_data = {
                item_name: request_data.item_name,
                kcal: request_data.kcal,
                carbs: request_data.carbs,
                protein: request_data.protein,
                fat: request_data.fat,
                desc_: request_data.desc_,
                image_id: request_data.image_id
            };

            const query = `INSERT INTO tbl_item_details SET ?`;
            const [insertResult] = await database.query(query, [item_data]);

            const item_id = insertResult.insertId;

            if(request_data.ingredient_id && request_data.ingredient_id.length > 0){
                const ingredientValues = request_data.ingredient_id.map(ingredient_id => [ingredient_id, item_id]);
                const insertIngredientQuery = `INSERT INTO tbl_rel_ingredient_item (ingredient_id, item_id) VALUES ?`;
                await database.query(insertIngredientQuery, [ingredientValues]);
            }
            return {
                code: response_code.SUCCESS,
                message: "Item and ingredients added successfully",
                item_id: item_id
            };
        }catch(error){
            return {
                code: response_code.OPERATION_FAILED,
                message: "ERROR",
                data: error.message
            };
        }
    }

}
module.exports = new AdminModel();